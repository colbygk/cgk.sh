---
title: docker-compose bind mounts
date: 2022-06-21
thumb: '/images/tech/docker-logo.jpg'
thumbcolor: black
description: Using environment variables to optionally use bind mount source location
---

##### docker-compose bind mounts will fail if the source does not exist

The volume bind mount type for docker-compose requires that the source directory/file exist before the directory/file is mounted. There are scenarios where you want to mount credentials, for example, `.aws`. This can keep the credentials out of a checked in `docker-compose.yml` and leave it to the responsibility of the developer.

Example configuration:

{% highlight plain %}
...
    - type: bind
      source: ~/.aws
      target: /root/.aws
      consistency: cached
      volume:
        nocopy: true
...
{% endhighlight %}

When using docker in a third-party CI/CD pipeline, this can cause errors like:

{% highlight plain %}
...
ERROR: for scratch-backpack-app  Cannot create container for service app: invalid mount config for type "bind": bind source path does not exist: /home/travis/.aws

ERROR: for app  Cannot create container for service app: invalid mount config for type "bind": bind source path does not exist: /home/travis/.aws
...
{% endhighlight %}

Since the home directory does not contain `.aws` the `docker-compose` command fails.

One solution:

{% highlight plain %}
...
    - type: bind
      source: ${AWS_CREDENTIALS_DIR:-~/.aws}
      target: /root/.aws
      consistency: cached
      volume:
        nocopy: true
...
{% endhighlight %}

Leveraging shell substitution syntax, this will look for an environment variable `AWS_CREDENTIALS_DIR` and use it if it exists. If it does not exist, it will default to `~/.aws`

Et voila, it is done!
