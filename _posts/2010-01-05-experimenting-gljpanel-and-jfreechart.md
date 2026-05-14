---
title: 'Experimenting with GLJPanel and jfreechart'
date: 2010-01-05 09:05:58
tags: ['jfreechart', 'jogl']
categories: ['opensource']
drupal_nid: 39
drupal_type: blog
---

<div class="img-float-right">
  <img src="/webfm_send/39"/>
  credit: <a href="http://jfree.org">JFree.org</a>
</div>In the interest of having snappy plotting software for use on the ATA software, I'm experimenting with jfreechart and how it updates a dynamic plot, and jfreechart's admitted performance issue:

From section 10.2.2 of the jfreechart 1.0.13 Developer Guide:
<blockquote style="border-right:0px">
10.2.2 Performance 
Regarding performance, you need to be aware that JFreeChart wasn’t designed speciﬁcally for generating real-time charts. Each time a dataset is updated, the ChartPanel reacts by redrawing the entire chart. Optimisations, such as only drawing the most recently added data point, are 
diﬃcult to implement in the general case, even more so given the Graphics2D abstraction (in the Java2D API) employed by JFreeChart. This limits the number of “frames per second” you will be able to achieve with JFreeChart. Whether this will be an issue for you depends on your data, the requirements of your application, and your operating environment. </blockquote>

I was wondering if the drawing was offloaded to opengl (and therefore more on the graphics card), that this updating process might be improved for this admittedly 2D focused work.  I'm doing this on my core 2 duo mac pro, ~2007, which has 2 GeForce 7300's in it (not top of the line, but no slouch). 

There are Java OpenGL bindings in the form of the JOGL library from Sun Microsystems.  JOGL comes with a class called GLJPanel which extends swing.JPanel, making it a drop-in replacement.

By taking the freely available source code to jfreechart, I attempted to test if the OpenGL version would perform better than the generic JPanel.  The dynamic/real-time demos I tested, come from the jfreechart source base and manual and they rely on the underlying jfreechart class, ChartPanel, which in turn, extends JPanel.
 
(note to self, contents of work are in Notebook/ATA/jfreechart/ )

Steps:

<ol>
  <li>checkout jfreechart,), svn co https://jfreechart.svn.sourceforge.net/svnroot/jfreechart jfreechart</li>
    <ol style="list-style-type: lower-alpha">
    <li>stable is 1.0.13 or jfreechart/branches/jfreechart-1.0.x-branch</li>
    </ol>
  <li>Download jogl-2.0-macosx-universal.zip from http://download.java.net/media/jogl/builds/archive/jsr-231-2.0-beta10/
and unzipped it in jfreechart-1.0.x-branch.  Ran profile.jogl script in jogl-2.0-macosx-universal/etc</li>
  <ol style="list-style-type: lower-alpha">
    <li>. jogl-2.0-macosx-universal/etc/profile.jogl JOGL_ALL /Users/colby/Notebook/ATA/jfreechart/jfreechart/branches/jfreechart-1.0.x-branch/jogl-2.0-macosx-universal/lib</li>
   </ol>
   <li>Edited jfreechart-1.0.x-branch/source/org/jfree/chart/ChartPanel.java and substituted GLJPanel for JPanel</li>
   <li>Downloaded jcommon-1.0.16.jar  and added to CLASSPATH to fulfill pre-req for jfreechart</li>
   <li>went into jfreechart-1.0.x-branch/ant and did a build (ant with no build target).</li>
   <li>Made sure CLASSPATH had new jfreechart jars in place.</li>
   <li>Downloaded DynamicDataDemo3.java and MemoryUsageDemo.java, built normally, ran against GLJPanel vs JPanel</li>
</ol>

Initial results seem disappointing, as noted in the following videos.  My suspicion is that the graphics primitives being used by jfreechart are ending up being translated to GL.  It would be interesting to add a layer to jfreechart that uses a GLDrawable (received from a passed in GLU context) as part of a jfree.plot.Plot interface (adding it as part of the draw(...) method) and then using that for the underlying primitives, will follow up.

<video width="870" height="619" src="/webfm_send/35" controls>
  <br>only works with HTML5 browser.
</video>
GLJPanel, voice: me. (<a href="/webfm_send/35">click here if you're unable to see the embedded video</a>)

<video width="860" height="619" src="/webfm_send/36" controls>
  <br>only works with HTML5 browser.
</video>
JPanel, voice: me. (<a href="/webfm_send/36">click here if you're unable to see the embedded video</a>)

<video width="870" height="619" src="/webfm_send/37" controls>
  <br>only works with HTML5 browser.
</video>
Both GLJPanel and JPanel, voice: me. (<a href="/webfm_send/37">click here if you're unable to see the embedded video</a>)
