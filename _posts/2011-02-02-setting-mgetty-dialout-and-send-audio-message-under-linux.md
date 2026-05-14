---
title: 'Setting up mgetty to dialout and send an audio message under Linux'
date: 2011-02-02 06:40:29
tags: ['linux', 'mgetty']
categories: ['opensource']
drupal_nid: 109
drupal_type: blog
---

<div class="img-float-left">
<a href="http://www.amazon.com/TRENDnet-Phone-Internet-Modem-TFM-561U/dp/B004BU8O9Y/ref=sr_1_2?ie=UTF8&qid=1296627755&sr=8-2" title="TRENDNet TFM-561U"><img src="/webfm_send/119" width="200" height="200" alt="TRENDNet TFM-561U USB Modem"/></a>
TRENDNet TFM-561U
</div>
Hardware used:
<a href="http://www.amazon.com/TRENDnet-Phone-Internet-Modem-TFM-561U/dp/B004BU8O9Y/ref=sr_1_2?ie=UTF8&qid=1296627755&sr=8-2">TRENDnet 56K USB 2.0 Phone, Internet, and Fax Modem TFM-561U (White)</a>

Under openSUSE 11.3, this modem is immediately detected when plugged into a USB port and the device file shows up as /dev/ttyACM0 (assuming you only have one).

The TRENDNet modem will respond with a device id of <code>56000</code> given the command <code>ATI</code>. mgetty that ships with openSUSE 11.3 will incorrectly detect this modem as a Rockwell and proceed to issue commands that the TRENDNet modem does not understand for voice modes.

Example errors that show up in <code>/var/log/vm.log</code>

{syntaxhighlighter brush: bash;}
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
{/syntaxhighlighter}

Downloaded mgetty source from http://mgetty.sourcearchive.com/downloads/1.1.36/mgetty_1.1.36.orig.tar.gz

Modified <code>mgetty-1.1.36/voice/libvoice/detect.c</code>:

{syntaxhighlighter brush: c;}
...
/*     {ati, "56000",                NULL,   &Rockwell},*/
     {ati, "56000",                NULL,   &V253modem},
...
{/syntaxhighlighter}

Note - configuring vgetty to force this setting is possible without modifying the source.  No such luck telling 'vm' to use the V253modem setup without modifying source.

Built mgetty via:

{syntaxhighlighter brush: plain;}
~/mgetty-1.1.36/ # cp policy.h-dist policy.h
~/mgetty-1.1.36/ # make && make install
~/mgetty-1.1.36/ # cd voice
~/mgetty-1.1.36/voice/ # make && make install 
{/syntaxhighlighter}

This will install into /usr/local.

Format of sound file:

The TRENDNet is picky about the audio file format used.  When I had originally thought the TRENDNet was Rockwell based (because mgetty seemed sure that it was) I encoded my test sound file as a Rockwell 4 format (4-bit Rockwell ADPCM), the indication that there was a problem with the sound file was not intuitive with the following error in <code>/var/log/vm.log</code> (note the "Wrong modem type found")

{syntaxhighlighter brush: bash;}
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
{/syntaxhighlighter}

Empirically found that the following sound encoding works:

{syntaxhighlighter brush: plain;}
# wavtopvf /tmp/testsound.wav | pvfspeed -s 7200 | pvftormd V253modem 9 > /var/spool/voice/messages/testsound.rmd
{/syntaxhighlighter}

Now, install Modem::Vgetty from CPAN and find where it installed its example scripts callme.pl and use it:

{syntaxhighlighter brush: plain;}
# /usr/local/bin/vm shell -S /usr/bin/perl callme.pl 8675309 /var/spool/voice/messages/testsound.rmd
{/syntaxhighlighter}

If it doesn't work, try adding <code>-x 9</code> just before <code>-S</code> and watch <code>/var/log/vm.log</code>

Resources:
 http://en.wikipedia.org/wiki/Voice_modem_command_set
 http://www.the-labs.com/Telephony/
 http://search.cpan.org/~yenya/Modem-Vgetty-0.03/Vgetty.pm
 http://www.section6.net/wiki/index.php/Turning_Linux_into_an_Answering_Machine
