---
title: 'dojokit charting'
date: 2010-01-12 18:09:16
tags: ['dojokit']
categories: ['opensource']
drupal_nid: 42
drupal_type: blog
---

<div class="img-float-right" style="margin-top:-5px;">
 <div id="chartOne" style="width: 400px; height: 300px; margin: 0px auto 0px auto;" >
  <link rel="stylesheet" type="text/css" href="http://ajax.googleapis.com/ajax/libs/dojo/1.3/dijit/themes/tundra/tundra.css">
    <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/dojo/1.3/dojo/dojo.xd.js" djConfig="parseOnLoad: true">
    </script>

  <script type="text/javascript">
    dojo.require("dojox.charting.Chart2D");
    dojo.require("dojox.charting.themes.Wetland");

    dojo.addOnLoad(function() {
        var c = new dojox.charting.Chart2D("chartOne");
        c.addPlot("default", {
            type: "StackedAreas",
            tension: 3
        }).addAxis("x", {
            fixLower: "major",
            fixUpper: "major"
        }).addAxis("y", {
            vertical: true,
            fixLower: "major",
            fixUpper: "major",
            min: 0
        }).setTheme(dojox.charting.themes.Wetland).addSeries("Series A", [1, 2, 0.5, 1.5, 1, 2.8, 0.4]).addSeries("Series B", [2.6, 1.8, 2, 1, 1.4, 0.7, 2]).addSeries("Series C", [6.3, 1.8, 3, 0.5, 4.4, 2.7, 2]).render();
    });
</script>
 </div>
</div>
Filing away into the possibly very useful bin, dojokit, a javascript library, appears to have a very decent dynamic charting (real-time data flow) API:


See: <a href="http://docs.dojocampus.org/dojox/charting">dojox.charting</a>
See: <a href="http://docs.dojocampus.org/dojox/">dojox</a>
