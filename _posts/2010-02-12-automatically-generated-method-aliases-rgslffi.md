---
title: 'automatically generated method aliases in GSL4r'
date: 2010-02-12 04:17:21
tags: ['gsl', 'jruby', 'ruby']
drupal_nid: 56
drupal_type: blog
---

Added automatically generated method wrappers for calls into the GSL library using the object itself:

<s>rgslffi</s> GSL4r is a set of wrapper routines I'm creating around <a href="http://www.gnu.org/software/gsl/">GNU Scientific Library (GSL)</a> mathematical routines using the <a href="http://wiki.github.com/ffi/ffi/why-use-ffi">Foreign Function Interface (FFI)</a> library for Ruby/JRuby.  Using FFI helps avoid tying GSL only to the C based Ruby interpreters and potentially will make the library universally available across all Ruby implementations.  Something we'd like to have while using JRuby for the ATA.

There's a lot of busy work involved, with long lists of GSL functions that need wrapping, and, I realized that simple wrapping would make my library cumbersome to use, for example, when using methods to manipulate complex numbers, if I only made a wrapper for the function:
{% highlight ruby %}
   attach_function :gsl_complex_add, [ GSL_Complex.by_value, GSL_Complex.by_value ], GSL_Complex.by_value
{% endhighlight %}

And the code to use it:
{% highlight ruby %}
  a=GSL_Complex.create(1,1)
  b=GSL_Complex.create(1,1)
  puts gsl_complex_add(a,b)
{% endhighlight %}

But what if I wanted to be able to do something like:
{% highlight ruby %}
  a=GSL_Complex.create(1,1)
  b=GSL_Complex.create(1,1)
  puts a.add(b)
{% endhighlight %}

The above would require creating another wrapper routine, with a shortened name.  Of course, there's always the overriding of operators, but that's for later.  I'd rather not have to do that much typing (at least quadruple the lines of code on top of the attach_function statements) and then have to worry about subtle typos creating bugs... bleah. Also, any attached functions in the same module namespace as the definition of the class for that module (e.g. GSL_Complex) ends up with all of those attached functions as members of that object, but without any nice invocation properties, i.e.:

{% highlight ruby %}
  # attaching in the same namespace as GSL_Complex
  a=GSL_Complex.create(1,1)
  a.methods.grep(/gsl_complex/)
  ["gsl_complex_abs", "gsl_complex_div_imag", "gsl_complex_mul", "gsl_complex_div_real", "gsl_complex_abs2", "gsl_complex_conjugate", "gsl_complex_div", "gsl_complex_add_imag", "gsl_complex_logabs", "gsl_complex_inverse", "gsl_complex_add_real", "gsl_complex_sub_imag", "gsl_complex_add", "gsl_complex_negative", "gsl_complex_sub_real", "gsl_complex_arg", "gsl_complex_mul_imag", "gsl_complex_sub", "gsl_complex_mul_real"]
  a.gsl_complex_abs
  ArgumentError: wrong number of arguments (0 for 1)
	from (eval):2:in `gsl_complex_abs'
	from (eval):2:in `abs'
	from (irb):6
  a.abs(a)
  => 1.4142135623731
{% endhighlight %}

Double bleah!

So, what to do?

I could try to make a parser of the gsl headers and create wrappers from that, but that seems inelegant to me, though, not necessarily a bad solution.  I may still pursue this option at a later time.

What I did was make use of the method_missing method for Object to catch any unrecognized method invocations, and then create a function at runtime if the method appears to match a function in the GSL library.  It also handles the full name, or a shortened version, e.g.
{% highlight ruby %}
gsl_complex_add()
{% endhighlight %}
vs
{% highlight ruby %}
add()
{% endhighlight %}

Here it is:
{% highlight ruby %}
  class GSL_Complex < ::FFI::Struct
  ..
    $globalGSLComplexLock = Monitor.new
  ...
    def method_missing( called_method, *args, &block )

      $globalGSLComplexLock.synchronize do

        prefix = "gsl_complex_"

        if ( ::GSL4r::Complex::Methods.respond_to?("#{prefix}#{called_method}") == false )
          prefix = ""
          if ( ::GSL4r::Complex::Methods.respond_to?("#{called_method}") == false )
            super # NoMethodError
          end
        end

        self.class.class_eval <<-end_eval
          def #{called_method}(*args, &block)
            args.insert(0, self)
            ::GSL4r::Complex::Methods::#{prefix}#{called_method}( *args, &block )
          end
        end_eval

        __send__(called_method, *args, &block)

      end # globalGSLComplexLock.synchronize
    end # method_missing
  ...
  end
{% endhighlight %}

This first checks if the called method matches the Module function call gsl_complex_#{called_method} (where called_method might be 'add').

If it finds a match (respond_to, lines 11,13), it will then create a new method for the class as a whole (class_eval, lines 18-23), making the method available to not just this instance of the class, but <em><u>all existing instances and all those created after</u></em>.
 
Finally, this is wrapped up in a synchronized block, using a Monitor object, to ensure thread safety.  It is only unsafe the first time the method is invoked (and non-existent at that point).  Every time the method is invoked after, it should not hit method_missing.  Even though all threads run under one thread in MRI, it won't be the case for our use of JRuby, and possibly not for MRI 1.9.

Some fun playing around in irb:
{% highlight ruby %}
colby@gks lib $ irb -r gsl4r
irb(main):001:0> require 'gsl4r/complex'
=> true
irb(main):002:0> include GSL4r
=> Object
irb(main):004:0> a=GSL_Complex.create(1,1)
=> (1.0,1.0)
irb(main):005:0> b=GSL_Complex.create(2,2)
=> (2.0,2.0)
irb(main):008:0> a.methods.grep(/abs/)
=> []
irb(main):006:0> b.methods.grep(/abs/)
=> []
irb(main):009:0> a.abs
=> 1.4142135623731
irb(main):011:0> b.methods.grep(/abs/)
=> ["abs"]
irb(main):012:0> b.add(a)
=> (3.0,3.0)
irb(main):013:0> a.logabs
=> 0.346573590279973
irb(main):014:0> a.gsl_complex_logabs
=> 0.346573590279973
{% endhighlight %}
