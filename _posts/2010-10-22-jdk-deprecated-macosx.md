---
title: 'JDK deprecated on Macosx'
date: 2010-10-22 03:59:30
drupal_nid: 105
drupal_type: blog
---

It looks like Apple may be dropping its own support for customizing the JDK to look and run well under MacOSX (<a href="http://developer.apple.com/library/mac/#releasenotes/Java/JavaSnowLeopardUpdate3LeopardUpdate8RN/NewandNoteworthy/NewandNoteworthy.html%23//apple_ref/doc/uid/TP40010380-CH4-SW1">0</a>)(<a href="http://www.sfgate.com/cgi-bin/article.cgi?f=/g/a/2010/10/21/businessinsider-apple-java-2010-10.DTL">1</a>)(<a href="http://www.theregister.co.uk/2010/10/21/apple_threatens_to_kill_java_on_the_mac/">2</a>)(<a href="http://www.zdnet.com.au/os-x-lion-to-roar-without-java-339306774.htm">3</a>)(<a href="http://blogs.computerworld.com/17205/apple_hints_no_java_support_in_tiger_oshttp://blogs.computerworld.com/17205/apple_hints_no_java_support_in_tiger_os">4</a>)(<a href="http://www.appleinsider.com/articles/10/10/21/apple_deprecates_its_release_of_java_for_mac_os_x.html">5</a>)

I've watched with great interest how Apple deals with the various languages it provides direct support to (such as MacRuby, GCC (C,C++,Fortran,...), future technologies such as LLVM and of course Java).  I can understand Apple's decision making behind Flash and not being willing to foster environments for it, but Java's utility goes far beyond Flash and web browsing.

The bulk of the control system for the Allen Telescope Array is written in Java and here I sit, in front of my desktop, a Mac Pro, running MacOSX, which is a full fledged software member of the ATA distributed control software, most of which is running on Linux systems.

Of course, there is already a way forward by installing OpenJDK (via: http://twitter.com/hiro_asari) http://wikis.sun.com/display/OpenJDK/Darwin10Build and http://lists.apple.com/archives/Java-dev/2008/Aug/msg00161.html which should allow Java to continue being a usable language on MacOSX.

However, this leaves behind the native GUI feel of Java desktop oriented software, forcing it through the generic X11 look and feel (which is none-to-pretty).  That isn't a show stopper to me, but, this is beginning to feel like a tipping point.

I could talk to friend and non-friend developers about the merits of Apple's decisions and feel comfortable about where Apple was going, until today.  After today, I'm deeply troubled by the direction Apple seems to be taking on this front.  This is mainly because of my own work with the ATA.

Several of the stories floating around about Apple dropping support are comparing it to Apple dropping support for Flash.  I disagree.  One of the reasons for dropping Flash is that Apple had no say in how Flash was developed and ported to MacOSX.

With Java, Apple has every say, they can speed up or slow down their own work on the port and backfill bug fixes, security fixes or performance enhancements and release on their own schedule, not Sun/Oracle's.

Apple could join OpenJDK (which <a href="https://www.ibm.com/developerworks/mydeveloperworks/blogs/JenniAloi/entry/ibm_backs_openjdk15?lang=en">
IBM recently decided to do</a>) and contribute directly to the direction of Java, if it felt an interest in doing so...  Unfortunately, my interest in them doing so doesn't really matter :).
