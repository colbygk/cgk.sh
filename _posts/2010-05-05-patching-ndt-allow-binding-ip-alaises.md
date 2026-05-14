---
title: 'patching ndt to allow binding to IP alaises'
date: 2010-05-05 04:09:09
tags: ['fakewww', 'internet2', 'kernel', 'linux', 'ndt', 'opensuse', 'web100']
categories: ['opensource']
drupal_nid: 75
drupal_type: blog
---

<div class="img-float-left">
 <img src="/webfm_send/106"/>
 <a href="http://www.internet2.edu/">Internet2</a> (yes, that's the logo)
</div>

Yes, the Internet 2 exists.  Yes, they continue research into tools and protocols for high speed networks.  This afternoon, I wanted to set up a server running the <a href="http://www.internet2.edu/performance/ndt/">Internet 2 Network Diagnostic Tool</a>.  I wanted to run it with their "fakewww" server so that it would be isolated away from other services on the server I set aside.  While fakewww allows one to specify the port it binds to, it does not allow it to bind to a specific address.  Again, I am made sad.  So, I fixed it and submitted the patch to the fine folks at Internet2, if they take the patch, I'll edit this to point at the release with the patch.

NDT servers are pretty nifty, here, try out ours: <a href="http://ndt.hcro.org">http://ndt.hcro.org</a>

These changes work against ndt-3.6.2b.tar.gz (current as of 12 Apr 2010, see <a href="http://software.internet2.edu/sources/ndt/">http://software.internet2.edu/sources/ndt/</a>).

{syntaxhighlighter brush: bash;}
uxmal:~/inst # tar xzf ndt-3.6.2b.tar.gz 
uxmal:~/inst # patch -p1 < specify-address.patch 
patching file ndt-3.6.2b/src/fakewww.c
patching file ndt-3.6.2b/src/network.c
patching file ndt-3.6.2b/src/usage.c
uxmal:~/inst # cd ndt-3.6.2b
uxmal:~/inst/ndt-3.6.2b # ./configure
...
uxmal:~/inst/ndt-3.6.2b # make && make install
...
uxmal:~/inst/ndt-3.6.2b # /usr/local/sbin/fakewww -a 74.43.140.29 -p 80 -d
May  4 21:06:03 fakewww server started (NDT version 3.6.2b)
	addr = ndt.hcro.org
	port = 80
	federated mode = off
	access log = /usr/local/ndt/access_log
	error log = /usr/local/ndt/error_log
	basedir = /usr/local/ndt
	debug level set to 1
{/syntaxhighlighter}

Full patch:
{syntaxhighlighter brush:diff;}
diff -up unpatched/ndt-3.6.2b/src/fakewww.c patched/ndt-3.6.2b/src/fakewww.c
--- unpatched/ndt-3.6.2b/src/fakewww.c	2010-03-25 08:45:12.000000000 -0700
+++ patched/ndt-3.6.2b/src/fakewww.c	2010-05-04 20:25:09.000000000 -0700
@@ -97,6 +97,7 @@ static struct option long_options[] = {
   {"help", 0, 0, 'h'},
   {"alog", 1, 0, 'l'},
   {"elog", 1, 0, 'e'},
+  {"address", 1, 0, 'a'},
   {"port", 1, 0, 'p'},
   {"ttl", 1, 0, 't'},
   {"federated", 0, 0, 'F'},
@@ -145,6 +146,8 @@ main(int argc, char** argv)
   struct sockaddr_storage cli_addr;
   I2Addr listenaddr = NULL;
   Allowed* ptr;
+  size_t l = 255;
+  char buf[256];
 
 #ifdef AF_INET6
 #define GETOPT_LONG_INET6(x) "46"x
@@ -153,7 +156,7 @@ main(int argc, char** argv)
 #endif
   
   while ((c = getopt_long(argc, argv,
-          GETOPT_LONG_INET6("dhl:e:p:t:Ff:b:sS:v"), long_options, 0)) != -1) {
+          GETOPT_LONG_INET6("dhl:e:a:p:t:Ff:b:sS:v"), long_options, 0)) != -1) {
     switch (c) {
       case '4':
         conn_options |= OPT_IPV4_ONLY;
@@ -177,6 +180,9 @@ main(int argc, char** argv)
       case 'e':
         ErLogFileName = optarg;
         break;
+      case 'a':
+        srcname = optarg;
+        break;
       case 'p':
         listenport = optarg;
         break;
@@ -262,6 +268,8 @@ main(int argc, char** argv)
 
   tt = time(0);
   log_println(1, "%15.15s fakewww server started (NDT version %s)", ctime(&tt)+4, VERSION);
+  I2AddrNodeName( listenaddr, buf, &l );
+  log_println(1, "\taddr = %s", buf);
   log_println(1, "\tport = %d", I2AddrPort(listenaddr));
   log_println(1, "\tfederated mode = %s", (federated == 1) ? "on" : "off");
   log_println(1, "\taccess log = %s\n\terror log = %s", AcLogFileName, ErLogFileName);
diff -up unpatched/ndt-3.6.2b/src/network.c patched/ndt-3.6.2b/src/network.c
--- unpatched/ndt-3.6.2b/src/network.c	2010-04-12 16:02:45.000000000 -0700
+++ patched/ndt-3.6.2b/src/network.c	2010-05-04 20:21:43.000000000 -0700
@@ -109,10 +109,11 @@ OpenSocket(I2Addr addr, char* serv, int
 failsock:
     /* RAC debug statemement 10/11/06 */
     log_println(1, "failsock: Unable to set socket options for fd=%d", fd);
-    while((close(fd) < 0) && (errno == EINTR));
+    while(fd > 3 && (close(fd) < 0) && (errno == EINTR));
+    fd = -1;
   }
   
-  if (meta.family == 0)
+  if (meta.family == 0 && ai != NULL)
     meta.family = ai->ai_family;
   return fd;
 }
diff -up unpatched/ndt-3.6.2b/src/usage.c patched/ndt-3.6.2b/src/usage.c
--- unpatched/ndt-3.6.2b/src/usage.c	2010-03-01 14:51:39.000000000 -0800
+++ patched/ndt-3.6.2b/src/usage.c	2010-05-04 20:21:43.000000000 -0700
@@ -161,6 +161,7 @@ www_long_usage(char* info)
     printf("  -b, --basedir path     - set the basedir for the documents\n");
     printf("  -S, --logfacility #F   - specify syslog facility name\n");
     printf("                           Note: this doesn't enable 'syslog'\n");
+    printf("  -a, --address          - specify alternate address to bind to\n");
     printf("  -p, --port #port       - specify the port number (default is 7123)\n");
     printf("  -t, --ttl #amount      - specify maximum number of hops in path (default is 10)\
n");
     printf("  --dflttree fn          - specify alternate 'Default.tree' file\n");
{/syntaxhighlighter}

Further notes on installation:

The host I decided to install on is running <a href="http://www.opensuse.org">openSUSE 11.1</a> Linux.  The NDT tools require special kernel patches to be installed, which, are helpfully provided at <a href="http://www.web100.org/download/">web100.org</a>.  The openSUSE 11.1 release comes with Linux Kernel 2.6.27 (sub-versioned to 2.6.27.21-0.1).  You should install kernel sources, sun's JDK, and libpcap-devel:

{syntaxhighlighter brush: bash;}
uxmal:~/inst/ndt-3.6.2b # zypper shell
zypper> install kernel-source
...
zypper> install java-1_5_0-sun-devel
...
zypper> install libpcap-devel
...
{/syntaxhighlighter}

Now, make backups of your running kernel and modules in /lib/modules/`uname -r`, then apply the patches:

{syntaxhighlighter brush: bash;}
uxmal:/usr/src/linux # patch -p1 < ~/inst/web100/web100-2.6.27-2.5.22-200810130047.patch
patching file Documentation/web100/locking.txt
patching file Documentation/web100/proc_interface.txt
patching file Documentation/web100/sysctl.txt
patching file Makefile
Hunk #1 FAILED at 1.
1 out of 1 hunk FAILED -- saving rejects to file Makefile.rej
patching file fs/proc/Makefile
...
{/syntaxhighlighter}

Note that the patches applied cleanly, except for Makefile, which collided with the "EXTRAVERSION", which is to be expected.  If you follow the <a href="http://www.internet2.edu/pubs/ndt-cookbook.pdf">NDT cookbook</a> or are already familiar with compiling the Linux Kernel, you'll know why.  Short answer, edit with:

{syntaxhighlighter brush: plain;}
EXTRAVERSION = .21-web100
{/syntaxhighlighter}

This will isolate the web100 changes away from pre-existing modules, making it easier to back out of the changes.

After this,

{syntaxhighlighter brush: bash;}
uxmal:/usr/src/linux # make oldconfig
scripts/kconfig/conf -o arch/x86/Kconfig
#
# using defaults found in /boot/config-2.6.27.21-0.1-pae
#
*
* Restart config...
*
*
* IP: Web100 networking enhancements
*
IP: Web100 networking enhancements (WEB100) [N/y] (NEW) Y
  Web100: Extended TCP statistics (WEB100_STATS) [N/y/?] (NEW) Y
    Web100:   Default file permissions (WEB100_FPERMS) [384] (NEW) Y
    Web100:   Default file permissions (WEB100_FPERMS) [384] (NEW) 
    Web100:   Default gid (WEB100_GID) [0] (NEW) 
    Web100:   Net100 extensions (WEB100_NET100) [N/y/?] (NEW) Y
  Web100: Netlink event notification service (WEB100_NETLINK) [N/y/?] (NEW) Y
#
# configuration written to .config
#
uxmal:/usr/src/linux # make
...
uxmal:/usr/src/linux # make install
...
uxmal:/usr/src/linux # mkinitrd
...
{/syntaxhighlighter}

Since openSUSE uses grub, I edited /boot/grub/menu.lst and made sure the default kernel to boot was the web100 enabled one.  After a successful reboot, I confirmed web100 extensions were active by:

{syntaxhighlighter brush: bash;}
uxmal:/usr/src/linux # cat /proc/web100/header | head -1
2.5.22 200810130047 net100
{/syntaxhighlighter}

Which is the version of web100 patches I installed.  Woop!

Notes,

If you do not have a copy of the sun JDK, the default JDK that comes with openSUSE 11.1 is based off of the GNU Java Compiler, which tries to create executables and you will see an error like this when building ndt,

{syntaxhighlighter brush: bash;}
uxmal:~/inst/ndt-3.6.2b # make
...
/usr/lib/gcc/i586-suse-linux/4.3/../../../crt1.o: In function `_start':
/usr/src/packages/BUILD/glibc-2.9/csu/../sysdeps/i386/elf/start.S:115: undefined reference to `main'
collect2: ld returned 1 exit status
make[2]: *** [Admin.class] Error 1
make[2]: Leaving directory `/root/inst/ndt-3.6.2b/Admin'
make[1]: *** [all-recursive] Error 1
make[1]: Leaving directory `/root/inst/ndt-3.6.2b'
make: *** [all] Error 2
{/syntaxhighlighter}

I picked 1.5 JDK since NDT is officially supported and tested against JDK 1.4.2.  Enough has changed between 1.4.2 and 1.6 that I thought this best.  I'm curious to hear if anyone has tried NDT against JDK 1.6...

If you don't install the libpcap-devel libraries and headers, running ./configure in ndt will skip attempting to build web100srv and if you try to build it by hand, you'll see the following error,

{syntaxhighlighter brush: bash;}
uxmal:~/inst/ndt-3.6.2b/src # make web100srv
gcc -DHAVE_CONFIG_H -I. -I.. -I/usr/local/include/web100  -I../I2util  '-DBASEDIR="/usr/local/ndt"'   -pedantic -Wall -O2 -DNDEBUG -DEXPERIMENTAL_ENABLED -DDATABASE_ENABLED -MT web100srv-web100srv.o -MD -MP -MF .deps/web100srv-web100srv.Tpo -c -o web100srv-web100srv.o `test -f 'web100srv.c' || echo './'`web100srv.c
web100srv.c:140: error: expected ‘=’, ‘,’, ‘;’, ‘asm’ or ‘__attribute__’ before ‘*’ token
web100srv.c:141: error: expected ‘=’, ‘,’, ‘;’, ‘asm’ or ‘__attribute__’ before ‘*’ token
...
{/syntaxhighlighter}

Finally, the startup script, ndt-3.6.2b/conf/ndt is moderately out of date.   With some changes, it can be pressed into service under openSUSE,

{syntaxhighlighter brush: bash;}
--- ndt	2010-05-04 22:30:04.000000000 -0700
+++ /etc/init.d/ndt	2010-05-04 22:48:51.000000000 -0700
@@ -5,7 +5,10 @@
 # written by Peter Bertoncini <pjb@anl.gov>
 
 # source function library
-. /etc/init.d/functions
+#. /etc/rc.d/init.d/functions
+
+test -s /etc/rc.status && \
+     . /etc/rc.status
 
 path=/usr/local/sbin
 
@@ -16,7 +19,8 @@ path=/usr/local/sbin
 # Specify some default options.
 # WEB100SRV_OPTIONS="-a --snaplog --tcpdump"
 NDTD_OPTIONS="-a --snaplog --tcpdump"
-FAKEWWW_OPTIONS=""
+FAKEWWW_OPTIONS="-a ndt.hcro.org -p 80"
+WEB100SRV_OPTIONS="-a -i eth0:ndt"
 RETVAL=0
 
 start ()
@@ -26,20 +30,19 @@ start ()
    if [ $cnt = 0 ]
    then
       cd /usr/local/ndt/serverdata
-      echo -n "Starting ndtd:"
-#     $path/web100srv -r -a -i eth0 > /dev/null 2>&1 & 
-#     $path/web100srv $WEB100SRV_OPTIONS > /dev/null 2>&1 &
-      $path/ndtd $NDTD_OPTIONS > /dev/null 2>&1 &
+      echo -n "Starting web100srv:"
+#      $path/web100srv -r -a -i eth0:ndt > /dev/null 2>&1 & 
+      $path/web100srv $WEB100SRV_OPTIONS > /dev/null 2>&1 &
+#      $path/ndtd $NDTD_OPTIONS > /dev/null 2>&1 &
       RETVAL=$?
       if [ $RETVAL = 0 ]
       then 
-	success
-        # touch /var/lock/subsys/web100srv
+	rc_status -v
+        touch /var/lock/subsys/web100srv
         touch /var/lock/subsys/ndtd
       else
-	failure
+	rc_failed 0
       fi
-      echo
    fi
    
    cnt=`ps auxw | grep fakewww | grep -v grep | wc -l`
@@ -50,12 +53,11 @@ start ()
       RETVAL=$?
       if [ $RETVAL = 0 ]
       then 
-	success
+	rc_status -v
         touch /var/lock/subsys/fakewww
       else
-	failure
+	rc_failed 0
       fi
-      echo
    fi
 }
 
@@ -63,24 +65,34 @@ stop()
 {
    # echo -n "Stopping web100srv:"
    # killproc web100srv -TERM
-   echo -n "Stopping ndtd:"
-   killproc ndtd -TERM
+   echo -n "Stopping web100srv:"
+   killproc web100srv -TERM
    RETVAL=$?
-   echo
-   # [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/web100srv
-   [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/ndtd
+   if [ $RETVAL = 0 ]
+   then 
+     rc_status -v
+   else
+     rc_failed 0
+   fi
+   [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/web100srv
+   #[ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/ndtd
 
    echo -n "Stopping fakewww:"
    killproc fakewww -TERM
    RETVAL=$?
-   echo
+   if [ $RETVAL = 0 ]
+   then 
+     rc_status -v
+   else
+     rc_failed 0
+   fi
    [ $RETVAL -eq 0 ] && rm -f /var/lock/subsys/fakewww
 }
 
 rhstatus() {
 	# status web100srv
-	status ndtd
-	status fakewww
+	rc_status ndtd
+	rc_status fakewww
 }
 restart() {
 	stop
{/syntaxhighlighter}


Note, this leaves the status messages not functioning, but start|stop will work.  To apply the patch, save the text to a file called ndt-init.patch in ndt-3.6.2b/conf, then,

{syntaxhighlighter brush: bash;}
uxmal:~/inst/ndt-3.6.2b/conf/ # patch -p0 < ndt-init.patch 
patching file ndt
{/syntaxhighlighter}

Copy the resulting ndt to /etc/init.d/ndt then,

{syntaxhighlighter brush: bash;}
uxmal:~/inst/ndt-3.6.2b/conf # chkconfig ndt on
uxmal:~/inst/ndt-3.6.2b/conf # chkconfig ndt
ndt  on
uxmal:~/inst/ndt-3.6.2b/conf # /etc/init.d/ndt start
Starting web100srv:                                                                 done
Starting fakewww:                                                                   done
{/syntaxhighlighter}

Last, the default html page must be created using ndt-3.6.2b/conf/create-html.sh,

{syntaxhighlighter brush: bash;}
uxmal:~/inst/ndt-3.6.2b # conf/create-html.sh 
Welcome to the NDT server configuration program.  This
program will create a custom tcpbw100.html file for your site.

Enter your site name [Internet2]  : Hat Creek Radio Observatory
Enter your site's location [Ann Arbor - MI]  : Hat Creek - CA
Server connection info, enter 1 for 100 Mbps, 2 for 1 Gbps [2]  : 1 

Information for email trouble reporting
Enter email userid [rcarlson]  : colby
Enter email domain name [internet2.edu]  : hcro.org
Enter default subject line [Trouble report from uxmal]  : Trouble report from HCRO NDT
The base web page 'tcpbw100.html' has now been created.  You
must move this file into the ndt_DATA directory [/usr/local/ndt]
created during the 'make' process.
Do you want to install this file now? [yes]  : 
Enter location [/usr/local/ndt]  : 
{/syntaxhighlighter}

et voila.
