import { useState } from "react";
import { getSampleChecklist } from "../components/helpers";
import type { ChecklistItem, TaskCategory } from "../components/types";

function generateChecklistItemId() {
  return `checklist-${Date.now()}-${Math.random().toString(32).slice(2)}`;
}

export function useTaskForm(initial?: {
  title?: string;
  category?: Exclude<TaskCategory, "All">;
  location?: string;
  budget?: string;
  deadline?: string;
  description?: string;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<Exclude<TaskCategory, "All">>(
    initial?.category ?? "Content Writing",
  );
  const [location, setLocation] = useState(initial?.location ?? "Remote");
  const [budget, setBudget] = useState(initial?.budget ?? "500");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, "uploading" | "done" | "error">
  >({});
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    getSampleChecklist("Content Writing"),
  );

  function changeCategory(next: Exclude<TaskCategory, "All">) {
    setCategory(next);
    setChecklist((current) => {
      const previousSample = getSampleChecklist(category);
      const isUsingSample =
        current.length === previousSample.length &&
        current.every(
          (item, index) =>
            item.id === previousSample[index].id &&
            item.label === previousSample[index].label &&
            item.description === previousSample[index].description,
        );
      return isUsingSample ? getSampleChecklist(next) : current;
    });
  }

  function addChecklistItem() {
    setChecklist((current) => [
      ...current,
      { id: generateChecklistItemId(), label: "", description: "" },
    ]);
  }

  function removeChecklistItem(id: string) {
    setChecklist((current) => current.filter((item) => item.id !== id));
  }

  function changeChecklistItemLabel(id: string, value: string) {
    setChecklist((current) =>
      current.map((item) =>
        item.id === id ? { ...item, label: value } : item,
      ),
    );
  }

  function changeChecklistItemDescription(id: string, value: string) {
    setChecklist((current) =>
      current.map((item) =>
        item.id === id ? { ...item, description: value } : item,
      ),
    );
  }

  function reset() {
    setTitle("");
    setLocation("Remote");
    setBudget("500");
    setDeadline("");
    setDescription("");
    setFiles([]);
    setCategory("Content Writing");
    setChecklist(getSampleChecklist("Content Writing"));
  }

  return {
    title,
    setTitle,
    category,
    changeCategory,
    location,
    setLocation,
    budget,
    setBudget,
    deadline,
    setDeadline,
    description,
    setDescription,
    files,
    setFiles,
    uploadProgress,
    setUploadProgress,
    checklist,
    setChecklist,
    addChecklistItem,
    removeChecklistItem,
    changeChecklistItemLabel,
    changeChecklistItemDescription,
    reset,
  };
}
