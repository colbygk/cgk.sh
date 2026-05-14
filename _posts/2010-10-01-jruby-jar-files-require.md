---
title: 'jruby, jar files, require'
date: 2010-10-01 17:57:16
drupal_nid: 97
drupal_type: book
---

JRuby coolism:

Create a jar file with resources within it, e.g.
jar cf test.jar *.jar *.rb

(assume that tester.rb is one of the files that will be bundled into the jar)
Now the following should work:
jruby -rtest.jar  -e 'require "tester"'
