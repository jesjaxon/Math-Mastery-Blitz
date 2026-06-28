Important — CocoaPods step (macOS only)

The `.xcworkspace` (with CocoaPods) doesn't exist until you run CocoaPods on macOS. After extracting the project on a Mac, run:

```bash
cd ios
pod install
```

This will generate `MathMinuteDrills.xcworkspace`. Always open the `.xcworkspace` in Xcode (not the `.xcodeproj`) so CocoaPods-managed dependencies are linked correctly.

If you don't have CocoaPods installed:

```bash
sudo gem install cocoapods
```

That's it — open `MathMinuteDrills.xcworkspace` in Xcode to build and run.
