# YOLO pose model

- File: `yolo11n-pose.onnx`
- Model card: https://huggingface.co/MikeLud/ObjectDetectionYOLO11-ONNX
- Artifact URL: https://huggingface.co/MikeLud/ObjectDetectionYOLO11-ONNX/resolve/main/yolo11n-pose.onnx
- Model card license: MIT
- SHA-256: `3f170e2b091fb37e4b0c4d36e90cf9d201592387b6210a1f10ad1fa9d1557199`
- Input: `images`, float32 `[1, 3, 640, 640]`
- Output: `output0`, float32 `[1, 56, 8400]` (COCO person box and 17 pose keypoints)

This model estimates human pose. VITAL's separate temporal state machine flags a possible fall from a rapid posture transition followed by sustained low, horizontal posture. Neither the pose model nor the temporal rule confirms injury or unconsciousness.
