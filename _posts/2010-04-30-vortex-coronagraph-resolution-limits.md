---
title: 'Vortex Coronagraph, resolution limits'
date: 2010-04-30 01:37:19
tags: ['exoplanets', 'vortex coronagraph']
categories: ['Astronomy']
drupal_nid: 74
drupal_type: blog
---

<div class="img-float-right">
 <img src="/webfm_send/99"/></a>
  Image of planets around HR8799, source: <a href="http://cfao.ucolick.org/members/view.php?id=33369&query=r%3Dmember%26l%3DM">C.Marois</a> et al <a href="http://dx.doi.org/10.1126/science.1166585">doi: 10.1126/science.1166585</a>
</div>

The star <a href="http://en.wikipedia.org/wiki/HR_8799">HR8799</a> hit the news in 2008 when direct images of planets orbiting it (seen at right, labeled b,c and d) were published by <a href="http://cfao.ucolick.org/members/view.php?id=33369&query=r%3Dmember%26l%3DM">Christian Marois</a> and his team at the <a href="http://en.wikipedia.org/wiki/Herzberg_Institute_of_Astrophysics">Herzberg Institute of Astrophysics</a>.  Taking direct images of planets around other stars is extremely difficult, as the brightness of the star exceeds the reflections from its planets by many thousands of times and, up until now, required using the most sophisticated telescopes available (Hubble, Keck, etc...).

However, a counter intuitive relationship between resolution and primary mirror size can enable this sort of direct imaging of exoplanets on much smaller telescopes.

<div class="img-float-right">
 <img src="/webfm_send/103"/></a>
  figure 1, source: C G-K
</div>
<div class="img-float-right">
 <img src="/webfm_send/102"/></a>
  figure 2, source: C G-K
</div>

<div class="img-float-left">
 <img src="/webfm_send/104"/></a>
  Image of planets (labeled b,c,d) in HR8799, source: Nature, <a href="http://dx.doi.org/10.1038/nature09007">doi:10.1038/nature09007</a>
</div>

<div class="img-float-right">
 <img src="/webfm_send/105"/></a>
  figure 3, source: Nature, <a href="http://dx.doi.org/10.1038/nature09007">doi:10.1038/nature09007</a>
</div>
This relationship is also an important consideration when planning to buy a telescope, to avoid buying one with a larger mirror, hoping that you will see finer detail.

The relationship between primary mirror size and the maximum resolution (or the ability to discern the differences between two objects within an image) can be estimated by the <a href="http://en.wikipedia.org/wiki/Dawes%27_limit">Dawes' Limit</a> (for visible light),

<center><img src="/webfm_send/100" border="0"/></center>

<b>&alpha;<sub>D</sub></b> is the workable Dawes' Limit in arcseconds, or best case resolution, given a mirror of diameter <b>D</b>.  Put another way, &alpha;<sub>D</sub> is the closest two objects can be in an image to see them as two separate objects.  There are techniques that can tease out objects even closer than this limit, but for my purposes, this equation helps illustrate how even small telescopes provide a best case resolution and why its worth it to put telescopes in space.

Consider the plots in figure 1 and figure 2.  The first plot, shows how this limit works for mirrors of common sizes.  Notice that a telescope with an 8inch mirror has a best case Dawes Limit resolution of about 0.5 arcseconds.  This is better than what you can usually get in even the best viewing conditions on the surface of the Earth.  Usually resolutions are limited to about 1.0 arcseconds because of the atmosphere above you causing slight shifts in the path the light from a star takes to get to the telescope (oh twinkle-twinkle, little star).  An 8inch telescope that may be in your closet or on your christmas list, can already get the best possible resolution on Earth without the aid of additional techniques such as <a href="http://en.wikipedia.org/wiki/Adaptive_optics">Adaptive Optics</a>.

Of course, increasing the size of the primary mirror does increase the over all light collecting area, which improves how well (or how quickly) you, or your camera, can see dim objects in the sky.

In figure 2, notice that a 24inch (or .6meter) mirror can resolve out at ~0.18 arcseconds, a 59inch (or 1meter) mirror at ~0.075 arcseconds and 94.5inches (or 2.4meter, the size of the Hubble Telescope mirror) at ~0.05 arcseconds. 

In a paper published in the 15 April 2010 issue of Nature and written by E. Serabyn, D. Mawet & R. Burruss, a device called a Vortex Coronograph was used to cancel out the light emitted by the star in HR8799, allowing the planets around it to be imaged, using a mirror 1.5meters across (with the aid of adaptive optics) all from the surface of the earth.

Normally, simple coronographs are as low tech as a little black dot on a sensor, used to block out the light of a central star, so that it is possible to see objects very near the star.  A vortex coronograph takes the central light of the star and cancels it out based on phase information about that light.  Essentially, it takes the bright spot of the star and translates it to the outer edges of the detector, while leaving the light from the inner objects (planets) within the field of view, see figure 3.

It's exciting to contemplate what one of these new fangled coronographs could do on larger telescopes, or on a space based telescope or even in my morning mocha.  This opens up the possibility of high-resolution spectroscopy of exoplanets, allowing earth based studies of the ever growing list of exoplanets in the sky that we know about. The prospects of picking out a planet with the characteristics for life as we know it are looking very good within the next 10 years.

Now, I just need to finish grinding my 16inch quartz blank, put a reflecting surface on it and integrate an adaptive optics system.  If only it were even that easy...

Thanks to <a href="http://astro.berkeley.edu/~fmarchis/">Franck Marchis</a> for bringing this to my attention.
