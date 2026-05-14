---
title: 'libpng12.so.0 no version information available'
date: 2010-02-18 20:26:16
tags: ['32bit', '64bit', 'libpng']
drupal_nid: 62
drupal_type: blog
---

On our 10.1 opensuse hosts, an annoying message is printed out at the start of running programs that are part of a <a href="http://bima.astro.umd.edu/miriad/">MIRIAD</a> install.  This appears to be related to an improperly built rpm for libpng that was distributed by many different linux distributions, including opensuse.

{syntaxhighlighter brush: plain;}
colby@peridot ~ % imfit
imfit: /usr/lib64/libpng12.so.0: no version information available (required by /hcro/miriad/build/lib/libpgplot.so.0)
ImFit: version 1.0 28-mar-03
### Fatal Error [imfit]:  The object keyword must be set
{/syntaxhighlighter}

It does not keep the programs from running, but, I've been wanting to fix this for a while and with a small amount of googling, came to the conclusion that the easiest fix would be to do a custom build of libpng.

After downloading the version I needed (<a href="http://sourceforge.net/projects/libpng/files/">libpng 1.2.x</a>) the default build steps of,

{syntaxhighlighter brush: plain;}
./configure --prefix=/usr
make
make install
{/syntaxhighlighter}

built and installed the libraries into /usr/lib.  Note that this is changing the libraries system wide, and requires root access to the host.  This does not create libraries for /usr/lib64 (for 64bit hosts), and you should not copy the 32-bit versions from /usr/lib/*png* into /usr/lib64, else you will see an error like:

{syntaxhighlighter brush: plain;}
error while loading shared libraries: libpng12.so.0: wrong ELF class: ELFCLASS32
{/syntaxhighlighter}

Here's what you can do to install 64-bit versions,

{syntaxhighlighter brush: plain;}
export CFLAGS="-m64"
export LDFLAGS="-m64"
./configure --prefix=/usr --libdir=/usr/lib64
make
make install
{/syntaxhighlighter}

et voila, no more annoying message about the libpng library!

{syntaxhighlighter brush: plain;}
colby@peridot ~ % imfit
ImFit: version 1.0 28-mar-03
### Fatal Error [imfit]:  The object keyword must be set
{/syntaxhighlighter}
