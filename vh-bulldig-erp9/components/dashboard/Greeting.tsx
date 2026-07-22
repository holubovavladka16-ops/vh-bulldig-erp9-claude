interface Props {
  firstName: string;
  companyName: string;
}

export default function Greeting({ firstName, companyName }: Props) {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-white md:text-2xl">
        Dobrý den, {firstName}.
      </h1>
      <p className="mt-1 text-white/50">
        Zde je aktuální přehled společnosti {companyName}.
      </p>
    </div>
  );
}
