import React from "react";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/context/SettingsContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface SettingsDropdownProps {
    id: string;
    label?: string;
    description?: string;
    className?: string;
    options: { [key: string]: string };
    onValueChange: (value: string) => void;
}

const SettingDropdown: React.FC<SettingsDropdownProps> = ({ id, label, description, className, options, onValueChange }) => {
    const { settings, updateSetting } = useSettings();

    const currentValue = settings[id] !== undefined ? settings[id] : Object.keys(options)[0];

    return (
        <div className={`flex items-center space-x-2 flex-col w-full ${className}`}>
            <Select value={currentValue} onValueChange={(value) => {
                updateSetting(id, value)
                onValueChange(value)
            }}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={label} />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(options).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Label htmlFor={id}>{label}</Label>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
};

export default SettingDropdown;