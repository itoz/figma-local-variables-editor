'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { getVariables, updateVariable } from "@/lib/api/figma";
import { useEffect, useState } from "react";

type Variable = {
  id: string;
  name: string;
  resolvedType: "COLOR" | "FLOAT";
  modeId: string;
  value: string;
};

type VariableCollection = {
  defaultModeId: string;
  variableIds: string[];
};

type VariableData = {
  id: string;
  name: string;
  resolvedType: "COLOR" | "FLOAT";
  valuesByMode: {
    [key: string]: any;
  };
};

type VariablesResponse = {
  meta: {
    variableCollections: {
      [key: string]: VariableCollection;
    };
    variables: {
      [key: string]: VariableData;
    };
  };
};

type ToastState = {
  open: boolean;
  title: string;
  description: string;
  variant: "default" | "destructive";
};

export default function VariableEditor() {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    title: "",
    description: "",
    variant: "default",
  });

  useEffect(() => {
    const fetchVariables = async () => {
      setLoading(true);
      try {
        const data = (await getVariables()) as VariablesResponse;
        const meta = data.meta;
        const collection = Object.values(meta.variableCollections)[0];
        const modeId = collection.defaultModeId;

        const vars = collection.variableIds.map((id: string) => {
          const v = meta.variables[id];
          const valueData = v.valuesByMode[modeId];
          let value = "";

          if (v.resolvedType === "COLOR") {
            const { r, g, b, a } = valueData;
            value = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
              b * 255
            )}, ${a})`;
          } else if (v.resolvedType === "FLOAT") {
            value = String(valueData);
          }

          return {
            id: v.id,
            name: v.name,
            resolvedType: v.resolvedType,
            modeId,
            value,
          };
        });

        setVariables(vars);
      } catch (error) {
        console.error("Failed to fetch variables:", error);
        setToast({
          open: true,
          title: "エラー",
          description: "変数の取得に失敗しました。",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVariables();
  }, []);

  const handleChange = (id: string, newValue: string) => {
    setVariables((prev) =>
      prev.map((v) => (v.id === id ? { ...v, value: newValue } : v))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const v of variables) {
        let newValue: any;

        if (v.resolvedType === "COLOR") {
          const match = v.value.match(
            /rgba?\((\d+),\s*(\d+),\s*(\d+),\s*(\d+(\.\d+)?)\)/
          );
          if (!match) continue;
          const [_, r, g, b, a] = match;
          newValue = {
            r: parseInt(r) / 255,
            g: parseInt(g) / 255,
            b: parseInt(b) / 255,
            a: parseFloat(a),
          };
        } else if (v.resolvedType === "FLOAT") {
          newValue = parseFloat(v.value);
        }

        await updateVariable(v.id, v.modeId, newValue);
      }

      setToast({
        open: true,
        title: "成功",
        description: "変数を更新しました。",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to save variables:", error);
      setToast({
        open: true,
        title: "エラー",
        description: "変数の更新に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex min-h-[400px] items-center justify-center rounded-md border">
          <Loader size={32} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-10">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variables.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell>{v.resolvedType}</TableCell>
                  <TableCell>
                    <Input
                      value={v.value}
                      onChange={(e) => handleChange(v.id, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader size={16} className="mr-2" />
                保存中...
              </>
            ) : (
              "保存"
            )}
          </Button>
        </div>
      </div>

      <ToastProvider>
        <Toast open={toast.open} onOpenChange={(open) => setToast({ ...toast, open })} variant={toast.variant}>
          <div className="grid gap-1">
            <ToastTitle>{toast.title}</ToastTitle>
            <ToastDescription>{toast.description}</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </>
  );
} 