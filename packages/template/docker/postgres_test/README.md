For running the tests, we use a few customizations in `postgresql.conf` to drastically increase the performance (cutting test runtime in about half).

The custom settings are added to the end of `postgresql.conf`:

    # http://blog.endpoint.com/2012/06/speeding-up-integration-tests-with.html
    # Speed up db tests through these settings
    fsync = off                # turns forced synchronization on or off
    synchronous_commit = off   # synchronization level; on, off, or local
    full_page_writes = off     # recover from partial page writes
