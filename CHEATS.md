`rm -rvf Podfile.lock && rm -rvf Podfile && rm -rvf Pods && flutter clean``
^ run in example/macos / example/ios when upgrading cpp files, or when getting cryptic errors about build cache.

Drop usually requires restoring build-info.cpp for  mac and ios.
It's a stock set of values with ex. git commit. That should be updated. Other than that you can leave it alone.