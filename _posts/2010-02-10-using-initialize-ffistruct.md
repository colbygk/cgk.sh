---
title: 'Using initialize in FFI::Struct'
date: 2010-02-10 21:12:33
tags: ['ffi', 'gsl4r', 'jruby', 'ruby']
categories: ['opensource']
drupal_nid: 55
drupal_type: blog
---

While working on <s>rgslffi</s>GSL4r, I needed to define a mapping for the gsl_complex struct (we'll ignore for now that gsl_complex is <a href="http://www.gnu.org/software/gsl/manual/html_node/Representation-of-complex-numbers.html">potentially platform dependent</a>).

Here's my attempt:

{syntaxhighlighter brush: ruby;}
  class GSL_Complex < ::FFI::Struct
    layout :dat, [:double, 2]

    R = 0
    I = 1

    def real()
      return self[:dat][R]
    end

    def imag()
      return self[:dat][I]
    end

    def equals( a )
      return ( a[:dat][R] == self[:dat][R] && a[:dat][I] == self[:dat][I] )
    end

    def set( r, i )
      self[:dat][R] = r
      self[:dat][I] = i
      return self
    end

    def set_real( r )
      self[:dat][R] = r
    end

    def set_imag( i )
      self[:dat][I] = i
    end

    def to_s()
      return "(#{self[:dat][R]},#{self[:dat][I]})"
    end
  end
{/syntaxhighlighter}

The methods added to the class definition match up with the GSL provided <a href="http://www.gnu.org/software/gsl/manual/html_node/Representation-of-complex-numbers.html">macros for manipulating gsl_complex types</a> and should be familiar to anyone who has used GSL or is looking at the GSL documentation.
 
I thought that it would be nice to add an initializer method that would provide for setting defaults at creation time, such as:
{syntaxhighlighter brush: ruby;}
    def initialize( r, i )
      self[:dat][R] = r
      self[:dat][I] = i
    end
{/syntaxhighlighter}

This fails spectacularly<a href="#stacktrace">[1]</a> in both JRuby, and, slightly less spectacularly, in MRI.  The error seems to be related to not knowing the layout of the struct before the code in the initializer is attempting to assign values.  It also seems to happen when you define even an empty initializer method.  I'm sure there's some expected reason for this to occur...

MRI 1.8.6:
{syntaxhighlighter brush: ruby;}
irb(main):002:0> a=GSL_Complex.new(1.0,2.0)
RuntimeError: layout not set for Struct
	from ./rgslffi/complex.rb:36:in `[]'
	from ./rgslffi/complex.rb:36:in `initialize'
	from (irb):2:in `new'
	from (irb):2
{/syntaxhighlighter}

It appears that the super class initializer needs to be called, here's the new version, but, with a different error (line numbers included):

{syntaxhighlighter brush: ruby;}
    def initialize( r, i )
     super()
      self[:dat][R] = r
      self[:dat][I] = i
    end
{/syntaxhighlighter}

But the error doesn't occur with creating a new copy of GSL_Complex, but when sending that object to RGSLffi::gsl_complex_conjugate:

{syntaxhighlighter brush: ruby;}
TypeError: can't convert FFI::MemoryPointer into Float
	from ./rgslffi/complex.rb:40:in `[]='
	from ./rgslffi/complex.rb:40:in `initialize'
	from (irb):4:in `gsl_complex_conjugate'
	from (irb):4
{/syntaxhighlighter}

Hrm...

<a name="stacktrace">[1]</a> JRuby 1.4.0:
{syntaxhighlighter brush: ruby;}
StructLayout.java:467:in `put': java.lang.NullPointerException
	from org/jruby/ext/ffi/StructLayout$Array$i_method_2_0$RUBYINVOKER$put.gen:-1:in `call'
	from CachingCallSite.java:330:in `cacheAndCall'
	from CachingCallSite.java:189:in `call'
	from AttrAssignTwoArgNode.java:42:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from BlockNode.java:71:in `interpret'
	from InterpretedMethod.java:229:in `call'
	from DefaultMethod.java:193:in `call'
	from CachingCallSite.java:196:in `callBlock'
	from CachingCallSite.java:203:in `call'
	from RubyClass.java:720:in `call'
	from DynamicMethod.java:184:in `call'
	from CachingCallSite.java:330:in `cacheAndCall'
	from CachingCallSite.java:189:in `call'
	from CallTwoArgNode.java:59:in `interpret'
	from DAsgnNode.java:110:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from RootNode.java:129:in `interpret'
	from ASTInterpreter.java:98:in `evalWithBinding'
	from RubyKernel.java:966:in `eval'
	from org/jruby/RubyKernel$s_method_0_3$RUBYFRAMEDINVOKER$eval.gen:-1:in `call'
	from DynamicMethod.java:150:in `call'
	from CachingCallSite.java:67:in `call'
	from FCallManyArgsNode.java:60:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from InterpretedMethod.java:112:in `call'
	from InterpretedMethod.java:124:in `call'
	from DefaultMethod.java:144:in `call'
	from CachingCallSite.java:67:in `call'
	from CallManyArgsNode.java:59:in `interpret'
	from FCallOneArgNode.java:36:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from BlockNode.java:71:in `interpret'
	from InterpretedMethod.java:210:in `call'
	from DefaultMethod.java:185:in `call'
	from CachingCallSite.java:187:in `call'
	from CallTwoArgNode.java:59:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from BlockNode.java:71:in `interpret'
	from RescueNode.java:225:in `executeBody'
	from RescueNode.java:147:in `interpretWithJavaExceptions'
	from RescueNode.java:110:in `interpret'
	from BeginNode.java:83:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from BlockNode.java:71:in `interpret'
	from InterpretedBlock.java:317:in `evalBlockBody'
	from InterpretedBlock.java:251:in `yield'
	from InterpretedBlock.java:185:in `yieldSpecific'
	from Block.java:99:in `yieldSpecific'
	from ZYieldNode.java:25:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from EnsureNode.java:96:in `interpret'
	from BeginNode.java:83:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from BlockNode.java:71:in `interpret'
	from InterpretedMethod.java:192:in `call'
	from DefaultMethod.java:177:in `call'
	from CachingCallSite.java:156:in `callBlock'
	from CachingCallSite.java:173:in `callIter'
	from FCallOneArgBlockNode.java:34:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from InterpretedBlock.java:317:in `evalBlockBody'
	from InterpretedBlock.java:216:in `yieldSpecific'
	from Block.java:117:in `yieldSpecific'
	from YieldTwoNode.java:31:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from IfNode.java:117:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from BlockNode.java:71:in `interpret'
	from RescueNode.java:225:in `executeBody'
	from RescueNode.java:147:in `interpretWithJavaExceptions'
	from RescueNode.java:110:in `interpret'
	from BeginNode.java:83:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from InterpretedBlock.java:317:in `evalBlockBody'
	from InterpretedBlock.java:268:in `yield'
	from Block.java:194:in `yield'
	from RubyKernel.java:1182:in `loop_1_9'
	from org/jruby/RubyKernel$s_method_0_0$RUBYFRAMEDINVOKER$loop_1_9.gen:-1:in `call'
	from CachingCallSite.java:300:in `cacheAndCall'
	from CachingCallSite.java:118:in `callBlock'
	from CachingCallSite.java:133:in `callIter'
	from FCallNoArgBlockNode.java:32:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from InterpretedBlock.java:317:in `evalBlockBody'
	from InterpretedBlock.java:268:in `yield'
	from Block.java:194:in `yield'
	from RubyKernel.java:1014:in `rbCatch'
	from org/jruby/RubyKernel$s_method_1_0$RUBYFRAMEDINVOKER$rbCatch.gen:-1:in `call'
	from CachingCallSite.java:320:in `cacheAndCall'
	from CachingCallSite.java:158:in `callBlock'
	from CachingCallSite.java:173:in `callIter'
	from FCallOneArgBlockNode.java:34:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from BlockNode.java:71:in `interpret'
	from InterpretedMethod.java:155:in `call'
	from DefaultMethod.java:161:in `call'
	from CachingCallSite.java:300:in `cacheAndCall'
	from CachingCallSite.java:118:in `callBlock'
	from CachingCallSite.java:123:in `call'
	from CallNoArgBlockNode.java:64:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from BlockNode.java:71:in `interpret'
	from InterpretedMethod.java:136:in `call'
	from DefaultMethod.java:153:in `call'
	from CachingCallSite.java:290:in `cacheAndCall'
	from CachingCallSite.java:109:in `call'
	from CallNoArgNode.java:61:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from InterpretedBlock.java:317:in `evalBlockBody'
	from InterpretedBlock.java:268:in `yield'
	from Block.java:194:in `yield'
	from RubyKernel.java:1014:in `rbCatch'
	from org/jruby/RubyKernel$s_method_1_0$RUBYFRAMEDINVOKER$rbCatch.gen:-1:in `call'
	from CachingCallSite.java:320:in `cacheAndCall'
	from CachingCallSite.java:158:in `callBlock'
	from CachingCallSite.java:173:in `callIter'
	from FCallOneArgBlockNode.java:34:in `interpret'
	from NewlineNode.java:104:in `interpret'
	from BlockNode.java:71:in `interpret'
	from InterpretedMethod.java:173:in `call'
	from DefaultMethod.java:169:in `call'
	from CachingCallSite.java:310:in `cacheAndCall'
	from CachingCallSite.java:149:in `call'
	from jirb:19:in `__file__'
	from jirb:-1:in `load'
	from Ruby.java:628:in `runScript'
	from Ruby.java:550:in `runNormally'
	from Ruby.java:396:in `runFromMain'
	from Main.java:272:in `run'
	from Main.java:117:in `run'
	from Main.java:97:in `main'
{/syntaxhighlighter}
