---
title: 'Switching JDKs in MacOSX'
date: 2009-12-15 17:55:00
tags: ['java', 'osx']
drupal_nid: 31
drupal_type: book
---

Bash functions written by Shawn Erickson for switching JDKs, still works in 2009!



<pre>
# ***********************************************************************************
# Written by Shawn Erickson - shawn at freetimesw.com
#
# Feel free to use as you like but at your own risk :)
#
# Last Update: 2005y 08m 25d, 1:15 PM PST
#
# The following functions are meant for use with bash shell which is currently the
# default on Mac OS X 10.4 (starting with 10.3 IIRC) unless otherwise configured.
#
# If your shell is already set to use BASH then skip to install steps below.
# If you don't know what shell you are using by default then open a terminal
# window and type "echo $SHELL" and hit return. If it lists "/bin/bash" then
# you are using bash by default. If not you have the option of changing the
# default in terminal, globally for your user, or on demand.
#
# ***********************************************************************************


### Java Environment Functions ###

J_VERSIONS_DIRECTORY="/System/Library/Frameworks/JavaVM.framework/Versions"
J_COMMANDS_SUBPATH="Commands"
J_HOME_SUBPATH="Home"

function availableJVMs()
{
	ls -1 $J_VERSIONS_DIRECTORY | grep ^[0-9].[0-9]
}

function listJava()
{
	local jvms=$(availableJVMs)
	echo "Available JVMs: "$jvms
	
	echo "Current Java:"
	java -version
}

function setJava()
{
	local target_jvm=""
	local jvms=$(availableJVMs)
	
	# Validate that the user requested an available JVM present on the system

	for jvm in $jvms ; do
		if [ "$jvm" == "$@" ]; then
			target_jvm=$@	
		fi
	done

	if [ "$target_jvm" == "" ]; then
		echo "Unsupported Java version requested"
		return;
	fi
	
	# If we get here the user asked for a valid JVM, so configure it

	echo "Configuring Shell Environment for Java "$@

	# First unset any current set java, back to default before doing configuration
	_unsetJava

	# Generate the paths needed for the JVM requested
	local jcmd="${J_VERSIONS_DIRECTORY}/$@/${J_COMMANDS_SUBPATH}"
	local jhome="${J_VERSIONS_DIRECTORY}/$@/${J_HOME_SUBPATH}"

	# We save the original path so we can toggle back if unset
	ORIGINAL_PATH="$PATH"
	PATH="$jcmd:${PATH}"
	
	# We save the original JAVA_HOME so we can toggle back if unset
	ORIGINAL_JAVA_HOME="$JAVA_HOME"
	JAVA_HOME="$jhome"
	
	# Update command prompt mode tag to note JVM setting
	CURRENT_MODE_STRING="J$@"

	echo "Current Java:"
	java -version
}

function _unsetJava()
{
	if [ "$CURRENT_MODE_STRING" != "" ]; then
        	PATH="$ORIGINAL_PATH"
		JAVA_HOME="$ORIGINAL_JAVA_HOME"
		CURRENT_MODE_STRING=""
	fi
}

function unsetJava()
{
	echo "Configuring Shell Environment for default Java"
 	_unsetJava

	echo "Current Java:"
        java -version
}
</pre>
