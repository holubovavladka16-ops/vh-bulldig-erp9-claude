import SettingsCard from "./SettingsCard";
import ImageUploadField from "./ImageUploadField";

interface Props {
  previewUrl: string | null;
  readOnly: boolean;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
  error?: string | null;
}

export default function WatermarkCard({ previewUrl, readOnly, onSelectFile, onRemove, error }: Props) {
  return (
    <SettingsCard title="Vodoznak společnosti">
      <ImageUploadField
        label="Vodoznak společnosti"
        uploadLabel="Nahrát vodoznak"
        previewUrl={previewUrl}
        onSelectFile={onSelectFile}
        onRemove={onRemove}
        readOnly={readOnly}
        error={error}
      />
    </SettingsCard>
  );
}
