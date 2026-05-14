---
title: 'Passing structs by value via ffi in ruby/jruby'
date: 2010-02-10 20:52:52
tags: ['ffi', 'gsl4r', 'jruby', 'ruby']
categories: ['gsl4r', 'opensource']
drupal_nid: 54
drupal_type: blog
---

I was stumped for a few hours on passing FFI::Structs into external routines, luckily, this post, <a href="http://groups.google.com/group/ruby-ffi/browse_thread/thread/ace0b94f7912799f#"> 'Functions returning structures' (groups/google/ruby-ffi)</a>, tipped me off by showing how to return a struct by value:

From the C code:
{syntaxhighlighter brush: ruby;}
...
    typedef struct
    { 
        int r, g, b, a; 
    } ALLEGRO_COLOR; 
...
{/syntaxhighlighter}

And the correct ruby FFI code:
{syntaxhighlighter brush: ruby;}
...
    class ALLEGRO_COLOR < FFI::Struct 
        layout :r, :float, 
               :g, :float, 
               :b, :float, 
               :a, :float 
    end 
    attach_function :al_map_rgb, [:uchar, :uchar, :uchar], ALLEGRO_COLOR.by_value
...
{/syntaxhighlighter}

The existing FFI documentation is anemic in this area, and focuses on the more complex, though yet, more often used passing of pointer references to FFI::Structs, making it not obvious what to do with routines to make use of passing in structs  'by value'.  Though, had I examined the methods offered by my derived GSL_Complex < FFI::Struct, I might have noticed the 'by_value'.  Offering documentation help to Wayne Meissner
 
Now I have the means to wrapper up the GSL (Gnu-Scientific Library) routines for my <a href="http://rubyforge.org/projects/gsl4r/">gsl4r</a> work.  The GSL library routines covering complex numbers pass around structs by value in a big way.

My ruby ffi code:
{syntaxhighlighter brush: ruby;}
...
  attach_function :gsl_complex_add, [ GSL_Complex.by_value, GSL_Complex.by_value ], GSL_Complex.by_value
...
{/syntaxhighlighter}

Demo:
{syntaxhighlighter brush: ruby;}
colby@gks lib $ jirb -r gsl4r
irb(main):001:0> include GSL4r
=> Object
irb(main):002:0> a=GSL_Complex.new
=> (0.0,0.0)
irb(main):003:0> a.set(1,1)
=> (1.0,1.0)
irb(main):004:0> b=GSL_Complex.new
=> (0.0,0.0)
irb(main):005:0> b.set(2,2)
=> (2.0,2.0)
irb(main):006:0> c=GSL4r::gsl_complex_add(a,b)
=> (3.0,3.0)
{/syntaxhighlighter}

Now, my next question is, <a href="http://shrewdraven.com/content/using-initialize-ffistruct">should it be possible to define an initializer for a class that inherits from FFI::Struct</a>?
