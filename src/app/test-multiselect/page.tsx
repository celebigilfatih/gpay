"use client";

import { useState } from "react";
import { MultiSelect } from "@/components/ui/multi-select";

const testOptions = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
  { value: "elderberry", label: "Elderberry" },
];

export default function TestMultiSelectPage() {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">MultiSelect Test</h1>
      
      <div className="max-w-md">
        <MultiSelect
          options={testOptions}
          selected={selected}
          onChange={setSelected}
          placeholder="Meyve seçiniz..."
          searchPlaceholder="Meyve ara..."
          emptyMessage="Meyve bulunamadı."
        />
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Seçilenler:</h3>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(selected, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}