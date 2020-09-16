---
title: 'setting up mgetty to dialout and send an audio message under linux'
date: 2011-02-01 10:00:00
thumb: '/images/tech/trendnet_thumb.jpg'
excerpt: using a TRENDnet USB modem
thumbcolor: white
---

<img src="/images/tech/trendnet.jpg"/>

Hardware used:
<a href="http://www.amazon.com/TRENDnet-Phone-Internet-Modem-TFM-561U/dp/B004BU8O9Y/ref=sr_1_2?ie=UTF8&qid=1296627755&sr=8-2">TRENDnet 56K USB 2.0 Phone, Internet, and Fax Modem TFM-561U (White)</a>

Under openSUSE 11.3, this modem is immediately detected when plugged into a USB port and the device file shows up as `/dev/ttyACM0` (assuming you only have one).

The TRENDNet modem will respond with a device id of 56000 given the command ATI. mgetty that ships with openSUSE 11.3 will incorrectly detect this modem as a Rockwell and proceed to issue commands that the TRENDNet modem does not understand for voice modes.

Example errors that show up in ``/var/log/vm.log`

{% highlight shell %}
...
02/01 21:14:19  reading port ttyACM0 configuration from config file /etc/mgetty+sendfax/voice.conf
02/01 21:14:19  detecting voice modem type
02/01 21:14:21  Rockwell detected
02/01 21:14:32  vm: timeout while reading character from voice modem
02/01 21:14:32  initializing ROCKWELL voice modem
02/01 21:14:32  vm: Modem returned ERROR
02/01 21:14:32  can't set silence period
02/01 21:14:32  vm: Modem returned ERROR
02/01 21:14:32  can't set transmit gain
02/01 21:14:32  vm: Modem returned ERROR
02/01 21:14:32  can't set record gain
02/01 21:14:32  vm: Modem returned ERROR
02/01 21:14:32  can't disable silence deletion
02/01 21:14:33  vm: Modem returned ERROR
02/01 21:14:33  can't set DLE responses
02/01 21:14:33  vm: Modem returned ERROR
02/01 21:14:33  can't set silence threshold
02/01 21:14:33  vm: Modem returned ERROR
02/01 21:14:44  vm: timeout while reading character from voice modem
02/01 21:15:20  vm: timeout while reading character from voice modem
02/01 21:15:20  vm: Modem returned ERROR
02/01 21:15:20  closing voice modem device
...
{% endhighlight %}

Downloaded mgetty source from <a href="http://mgetty.sourcearchive.com/downloads/1.1.36/mgetty_1.1.36.orig.tar.gz">http://mgetty.sourcearchive.com/downloads/1.1.36/mgetty_1.1.36.orig.tar.gz</a>

Modified `mgetty-1.1.36/voice/libvoice/detect.c`:

{% highlight shell %}
...
/*     {ati, "56000",                NULL,   &Rockwell},*/
     {ati, "56000",                NULL,   &V253modem},
...
{% endhighlight %}
Note - configuring vgetty to force this setting is possible without modifying the source. No such luck telling 'vm' to use the V253modem setup without modifying source.

Built mgetty via:

{% highlight shell %}
~/mgetty-1.1.36/ # cp policy.h-dist policy.h
~/mgetty-1.1.36/ # make && make install
~/mgetty-1.1.36/ # cd voice
~/mgetty-1.1.36/voice/ # make && make install
{% endhighlight %}

This will install into /usr/local.

Format of sound file:

The TRENDNet is picky about the audio file format used. When I had originally thought the TRENDNet was Rockwell based (because mgetty seemed sure that it was) I encoded my test sound file as a Rockwell 4 format (4-bit Rockwell ADPCM), the indication that there was a problem with the sound file was not intuitive with the following error in /var/log/vm.log (note the "Wrong modem type found")

{% highlight shell %}
02/01 22:09:35  playing voice file /var/spool/voice/messages/b.rmd
02/01 22:09:35  can't get group 'phone': Success
02/01 22:09:35   vm: raw modem data header found
02/01 22:09:35  vm: Wrong modem type found
02/01 22:09:35   vm(1): ERROR
02/01 22:09:35   vm(1): READY
02/01 22:09:35    vm: Got pipe signal
02/01 22:09:35    vm: queued event SIGNAL_SIGPIPE at position 0009
02/01 22:09:35    vm: unqueued event SIGNAL_SIGPIPE at position 0009
02/01 22:09:35    vm: voice_handle_event got event SIGNAL_SIGPIPE with data <_>
02/01 22:09:35   shell(1): GOODBYE
02/01 22:09:35   vm(1): GOODBYE SHELL
02/01 22:09:35    vm: Got pipe signal
02/01 22:09:35    vm: queued event SIGNAL_SIGPIPE at position 0010
02/01 22:09:35  vm: could not write to shell
02/01 22:09:35  vm: Could not handle event, something failed
{% endhighlight %}

Empirically found that the following sound encoding works:

{% highlight shell %}
# wavtopvf /tmp/testsound.wav | pvfspeed -s 7200 | pvftormd V253modem 9 > /var/spool/voice/messages/testsound.rmd
{% endhighlight %}

Now, install Modem::Vgetty from CPAN and find where it installed its example scripts `callme.pl` and use it:

{% highlight shell %}
# /usr/local/bin/vm shell -S /usr/bin/perl callme.pl 8675309 /var/spool/voice/messages/testsound.rmd
{% endhighlight %}

If it doesn't work, try adding `-x 9` just before `-S` and watch `/var/log/vm.log`

Resources:  
<a href="http://en.wikipedia.org/wiki/Voice_modem_command_set">http://en.wikipedia.org/wiki/Voice_modem_command_set</a>  
<a href="http://www.the-labs.com/Telephony/">http://www.the-labs.com/Telephony/</a>  
<a href="http://search.cpan.org/~yenya/Modem-Vgetty-0.03/Vgetty.pm">http://search.cpan.org/~yenya/Modem-Vgetty-0.03/Vgetty.pm</a>  
