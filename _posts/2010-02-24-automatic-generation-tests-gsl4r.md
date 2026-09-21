---
title: 'automatic generation of tests in gsl4r'
date: 2010-02-24 03:43:16
tags: ['gsl', 'ruby']
categories: ['gsl4r']
drupal_nid: 65
drupal_type: blog
---

<div class="img-float-right">
  <img src="/webfm_send/61"/>
   fig 1 - Testing of Ruby FFI wrappers for GSL against results from direct C calls
</div>

Wrapping <a href="http://www.rubyinside.com/ruby-ffi-library-calling-external-libraries-now-easier-1293.html">FFI</a> based ruby calls to <a href="http://www.gnu.org/software/gsl/">GSL</a> requires handling 1000+ functions with their various features of calling arguments and returns.  That's an error prone business and I wanted to have tests that would automatically check that my wrappers results match up with results from calling GSL functions within a C program.<a href="#someday">[1]</a><a name="one"></a>

This made me depressed.

I was looking at having to hand code C programs to generate answers from functions like, "gsl_complex_sqrt_real(2.0)" (which is  (1.4142135623731,0.0) by the by).  And then another set of Ruby programs that would cross check those answers against my FFI wrappered calls to GSL.  That's a lot of extra coding (see fig 1 for an individual test).

I chewed on this for several days, and when I had time to work on GSL4r again, I decided to add a GSL4r::Harness module, which would include the following methods:

<ul>
  <li>write_c_tests
  </li>
<li>compile_c_tests
  </li>
<li>run_c_tests
</li>
</ul>

<div class="img-float-left">
  <img src="/webfm_send/63"/>
   fig 2 - Generalizing the creation of wrappers and their tests against C calls
</div>

These methods would create C programs, these C programs would have all the proper variable typing and instantiation and results gathering to then write out Ruby source code, which would then make calls to my FFI wrappers and compare the results against the answers, written by the C program directly into the Ruby code it had generated.  Yahtzee! (see fig 2)

<h3>write_c_tests</h3>
In <a href="http://shrewdraven.com/content/automatically-generated-method-aliases-gsl4r">another post</a> I described using the <a href="http://www.ruby-doc.org/docs/ProgrammingRuby/ospace.html">reflection features of Ruby</a> to automatically create simpler, or nicely named function aliases, turning all calls from A.gsl_complex_func() into A.func().

Using the same reflection features, I mixin the GSL4r::Harness module into a class specific GSL4r::Complex::Harness, which implements attributes used to help create a compilable C file and a runnable Ruby output from the compiled C program:

{% highlight ruby %}
module GSL4r
  module Complex
    class Harness
      include ::GSL4r::Harness

      def initialize
        @c_compiler = "gcc"
        @c_src_name = "gsl_complex_tests_gen.c"
        @c_binary = "gsl_complex_tests_gen"
        @c_includes = ["gsl/gsl_complex.h","gsl/gsl_complex_math.h"]
        @c_libs = [`gsl-config --libs`.chomp,`gsl-config --cflags`.chomp]
        @c_tests = ::GSL4r::Complex::Methods.methods.grep(/^c_test/)
        @r_header = %Q{$: << File.join('..','lib')\\nrequire 'test/unit'\\nrequire 'test/unit/autorunner'\\nrequire 'gsl4r/complex'\\ninclude GSL4r::Complex\\nclass ComplexTests < Test::Unit::TestCase\\n  EPSILON = 5.0e-15}

        @r_footer = %Q{end}

      end # initialize
    end # GSL4r::Complex::Harness
  end # GSL4r::Complex
end # GSL4r
{% endhighlight %}

Note: The extra slashes in @r_header are required so that they are not escaped before being written to disk via Ruby eval statements.

The GSL4r::GSL_Complex class also includes helper methods for translating the GSL_Complex Ruby based FFI::Struct into a generic C based gsl_complex struct, such as how the type is declared, initialized and assigned values:

{% highlight ruby %}
...
        def r_type()
          "GSL_Complex"
        end

        def r_equals(v1,v2)
          "#{v1.to_s}.equals(#{v2.to_s})"
        end

        def r_assignment( name )
          "#{name}.set(2.0,2.0)" # these numbers should make c_assignment for the test
        end

        def c_to_r_assignment(v1,v2)
          "printf(\\\"  #{v1}.set(%.15g,%.15g)\\\\n\\\",GSL_REAL(#{v2}),GSL_IMAG(#{v2}));\\n"
        end

        def c_type()
          "gsl_complex"
        end

        def c_assignment( name )
          "GSL_SET_COMPLEX(&#{name}, 2.0, 2.0);"
        end
...
{% endhighlight %}

Each GSL function is referenced using normal FFI syntax, such as:

{% highlight ruby %}
        attach_function :gsl_complex_arg, [ GSL_Complex.by_value ], :double
{% endhighlight %}

But, I want to have an extra method call created, in the form:

{% highlight ruby %}
  c_test_gsl_complex_func ...
{% endhighlight %}

I did this by creating a utility method called attach_gsl_function which, first attaches the function in the normal FFI way, but then creates the c_test_ version of the method as well, which, returns a string that is composed of the text for the C code that will make a call to the GSL method, and will write the results as a Ruby program to compare the answer to my wrapper function.  Easy!

{% highlight ruby %}
    def attach_gsl_function( method_name, args, return_var, args_type=nil, return_type=nil )

      # This function is attached to the extended ::FFI::Library
      # module from the calling namespace, e.g. ::GSL4r::Complex::Methods
      attach_function method_name, args, return_var

      if ( args_type != nil )
        # prepare c and ruby args code
        c_src = ""
        c_call_vars = []
        c_return_name = "c_r#{$c_var_num}"
        r_src = []
        if ( ! args_type.is_a?(Array) )
          args_type = Array.new([args_type])
        end
        args_type.each { |a_t|
          c_var_name = "v#{$c_var_num += 1}"
          c_src << (a_t.respond_to?("c_type") ?
                    "  #{a_t.c_type} #{c_var_name};\n" : "#{a_t.to_s} #{c_var_name} ")
          c_src << (a_t.respond_to?("c_assignment") ?
                    "  #{a_t.c_assignment("#{c_var_name}")}\n" : "= (#{a_t.to_s})2.0;\n")
          c_call_vars << "#{c_var_name}"

          r_src << (a_t.respond_to?("r_type") ?
                    "  #{c_var_name} = #{a_t.r_type}.create" : "")
          r_src << (a_t.respond_to?("r_assignment") ?
                    "  #{a_t.r_assignment("#{c_var_name}")}" : "  #{c_var_name} = 2.0")
        } # args_type.each
        # prepare c return type
        c_src << (return_type.respond_to?("c_type") ?
                  "  #{return_type.c_type} #{c_return_name};\n" :
                  "  #{return_type.to_s} #{c_return_name};\n")

        # prepare c call
        c_src << "  #{c_return_name} = #{method_name}(#{c_call_vars.join(",")});\n"

        # now generate the ruby code for the unit test
        c_src << "  puts(" << %Q{\\"def test_#{method_name}()\\"} << ");\n"

        # TODO, Need to insert ruby object instantiation code here!
        #
        r_src.each { |v|
          c_src << "  puts(" << %Q{\\"#{v}\\"} << ");\n"
        }

        r_r1 = "r_r1" # ruby result
        c_src << "  puts(" << %Q{\\"  #{r_r1} = ::#{self.to_s}::#{method_name}(#{c_call_vars.join(",")})\\"} << ");\n"
        if ( return_type.respond_to?("c_to_r_assignment") )
          r_r2 = "r_r2" # ruby result comparitor
          c_src << "  puts(" << %Q{\\"  #{r_r2} = #{return_type.r_type}.new\\"} << ");\n"
          c_src << "  #{return_type.c_to_r_assignment(r_r2,c_return_name)}"
          c_src << "  printf(" << %Q{\\"  assert r_r1.equals(r_r2)\\\\n\\"} << ");\n"
        else
          c_src << "  printf(" << %Q{\\"  assert_in_delta r_r1, %.15g, EPSILON\\\\n\\"} << ", #{c_return_name});\n"
        end

        c_src << "  puts(" << %Q{\\"end\\"} << ");"
        eval <<-end_eval
        def c_test_#{method_name}
          # Build list of arguments and their values
          "#{c_src}"
        end
        end_eval
      end # if args_type != nil
    end # attach_gsl_function
{% endhighlight %}

This dense bit of jiggery-pokery is probably going to be rewritten in the future; multiple times.  Right now it produces correct C code to help test all of the functions I have already included into the GSL4r::Complex module (~2 dozen).  It lacks handling of pointers, which will be absolutely essential for adding in more GSL routines.

So, to recap, for each GSL function included, the shadow c_test_method is created, which can then be iterated over to create the C source code and write it to disk:

{% highlight ruby %}
    def write_c_tests
      f = File.new("#{TEST_DIR}/#{@c_src_name}", "w")
      f.puts "/* Auto generated by #{self.class.name} */"
      f.puts "#include <stdio.h>"
      @c_includes.each { |i|
        f.puts "#include \"#{i}\""
      }
      f.puts "int main( int argc, char **argv )\n{\n"

      f.puts "  puts(\"#{@r_header}\");"

      @c_tests.each { |t|
        t_fqmn_a = self.class.name.split("::")
        t_fqmn_a.pop
        src = ""
        eval <<-end_eval
           src = ::#{t_fqmn_a.join("::")}::Methods::#{t}
        end_eval
        f.puts " /* #{t} */"
        f.puts src
      }

      f.puts "  puts(\"#{@r_footer}\");"

      f.puts "  return(0);\n}\n"
      f.close
    end
{% endhighlight %}

The real meat of write_c_tests is at line 17, which is the call to the c_test_method on each gsl function attached for the ::Harness module making the call, in this case, GSL4r::Complex.

Once written, it's time to,

<h3>compile_c_tests</h3>

Using attributes defined in GSL4r::Complex::Harness, described above, the generated test is compiled and written as test/gsl_complex_tests_gen.

{% highlight ruby %}
    def compile_c_tests
      compile_s = "#{@c_compiler} #{@c_flags.join(" ")} " +
        "-o #{TEST_DIR}/#{@c_binary} #{TEST_DIR}/#{@c_src_name}"
      p compile_s
      `#{compile_s}`
    end
{% endhighlight %}

and sample output of this:

{% highlight text %}
gcc -L/opt/local/lib -lgsl -lgslcblas -lm -I/opt/local/include -o test/gsl_complex_tests_gen test/gsl_complex_tests_gen.c
{% endhighlight %}

<h3>run_c_tests</h3>

This is dead simple:

{% highlight ruby %}
    def run_c_tests( filename )
      `#{TEST_DIR}/#{@c_binary} > test/#{filename}`
    end
{% endhighlight %}

In this case, the passed in filename is test/complex_test.rb

This is all run out of the task :setup_tests in the Rakefile for gsl4r which then is picked up after by the :test task, which looks for all files matching "test/*_test.rb".  Finding complex_test.rb, which looks something like this:

{% highlight ruby %}
$: << File.join('..','lib')
# generated by gsl_complex_tests_gen
require 'test/unit'
require 'test/unit/autorunner'
require 'gsl4r/complex'
include GSL4r::Complex
class ComplexTests < Test::Unit::TestCase
  EPSILON = 5.0e-15
  def test_gsl_complex_add_real()
    v12 = GSL_Complex.create
    v12.set(2.0,2.0)
    v13 = 2.0
    r_r1 = ::GSL4r::Complex::Methods::gsl_complex_add_real(v12,v13)
    r_r2 = GSL_Complex.new
    r_r2.set(4,2)
    assert r_r1.equals(r_r2)
  end
...
{% endhighlight %}

And when run, looks like the normal output from Test::Unit::AutoRunner

{% highlight text %}
Loaded suite test
Started
....................
Finished in 0.002378 seconds.
{% endhighlight %}

<h3>But what does it all mean?</h3>
With the addition of the attach_gsl_function and the ability for the GSL4r library to automatically check my wrapper results against a C version of a call to GSL functions, I can double check my work, without writing many extra C and Ruby testing routines.  It's all automatically generated and, has already saved me from a typo error when declaring a GSL method, a typo error that I might not have noticed until someone else submitted a bug report.

Creation of this code would not have been possible without the work of Wayne Meissner (FFI), Yukihiro Matsumoto (Ruby), Charles Nutters' blogging about FFI and of course, the Ruby community.

<a name="someday">[1]</a> Someday, I may feel compelled to figure out the FFI::Generator interface to try generating the individual calls to GSL routines.<a href="#one">&uArr;</a>
