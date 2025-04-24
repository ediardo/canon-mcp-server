from transformers import AutoModel, AutoImageProcessor
import torch

model_id = "google/siglip2-base-patch32-256"
model = AutoModel.from_pretrained(model_id)
processor = AutoImageProcessor.from_pretrained(model_id)

# Prepare a dummy image input
dummy_input = processor(images=torch.rand(1, 3, 256, 256), return_tensors="pt")

# Trace only the vision (image) encoder
image_input = dummy_input["pixel_values"]

torch.onnx.export(
    model.vision_model,             # Only the vision encoder
    image_input,                    # Input tensor
    "siglip_image_encoder.onnx",    # Output ONNX file
    input_names=["pixel_values"],
    output_names=["image_embeds"],
    dynamic_axes={"pixel_values": {0: "batch_size"}, "image_embeds": {0: "batch_size"}},
    opset_version=14
)