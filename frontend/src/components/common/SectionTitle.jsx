export default function SectionTitle({title,subtitle}) {
    return (
        <div className="mb-6">
            <h2 className="text-2xl font-bold">
                {title}
            </h2>
            <p className="text-zinc-500 mt-1">
                {subtitle}
            </p>
        </div>
    );
}