import SettingsCard from "./SettingsCard";
import ImageUploadField from "./ImageUploadField";

interface Props {
  previewUrl: string | null;
  readOnly: boolean;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
  error?: string | null;
}

export default function LogoCard({ previewUrl, readOnly, onSelectFile, onRemove, error }: Props) {
  return (
    <SettingsCard title="Logo společnosti">
      <ImageUploadField
        label="Logo společnosti"
        uploadLabel="Nahrát logo"
        previewUrl={previewUrl}
        onSelectFile={onSelectFile}
        onRemove={onRemove}
        readOnly={readOnly}
        error={error}
      />
    </SettingsCard>
  );
}
