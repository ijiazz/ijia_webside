import { useState, ComponentType } from "react";
import Cropper, { CropperProps } from "react-easy-crop";

const ImageCrop = Cropper as unknown as ComponentType<Partial<CropperProps>>;

export type CropProps = {
  imageURL: string;
};
export function Crop(props: CropProps) {
  const { imageURL } = props;
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  return (
    <ImageCrop
      image={imageURL}
      crop={crop}
      zoom={zoom}
      aspect={4 / 3}
      onCropChange={setCrop}
      onCropComplete={(croppedArea, croppedAreaPixels) => {
        console.log(croppedArea, croppedAreaPixels);
      }}
      onZoomChange={setZoom}
    />
  );
}
