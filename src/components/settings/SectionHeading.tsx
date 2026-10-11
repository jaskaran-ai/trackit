/** A titled block inside a settings card. Renders on the server or the client. */
export default function SectionHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-500 text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {children && <div className="mt-2.5">{children}</div>}
    </div>
  );
}
