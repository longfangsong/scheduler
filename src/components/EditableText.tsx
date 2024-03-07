import { ChangeEvent, useEffect, useRef, useState } from "react";

export function EditableText({ initialText, onBlur }: { initialText: string, onBlur: (value: string) => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialText);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    function startEditing() {
        setIsEditing(true);
    }

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        setValue(e.currentTarget.value);
    }

    function handleBlur() {
        setIsEditing(false);
        onBlur(value);
    }

    return (
        <div>
            {isEditing ? (
                <input
                    className="w-8 p-0 text-center bg-white text-black"
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoFocus
                />
            ) : (
                <div className="w-8" onClick={startEditing}>{value}</div>
            )}
        </div>
    );
}
