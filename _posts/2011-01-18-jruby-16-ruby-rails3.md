---
title: 'jruby 1.6 with ruby on rails3'
date: 2011-01-18 20:01:23
drupal_nid: 108
drupal_type: book
---

Have jruby apply a jruby template to rails:

rails new projectname -m http://jruby.org/rails3.rb

To have it work against mysql:

Edit config/environment.rb and add mysql-connector-java jar

require '/home/user/Downloads/jruby-1.6.0.RC1/lib/ruby/gems/1.8/gems/jdbc-mysql-5.1.13/lib/mysql-connector-java-5.1.13.jar'
