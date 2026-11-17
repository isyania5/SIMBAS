"use client";

import { useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function ModalDialog({
  title,
  description,
  trigger,
  triggerClassName,
  children,
}: {
  title: string;
  description: string;
  trigger: ReactNode;
  triggerClassName: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={triggerClassName}
      >
        {trigger}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="sim-modal"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-base font-bold text-navy">{title}</h2>
              <p className="mt-1 text-xs leading-5 text-[#858ba1]">{description}</p>
            </div>
            <button type="button" aria-label="Tutup dialog" onClick={() => dialogRef.current?.close()} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#858ba1] hover:bg-[#f1f2f7]">
              <X size={16} />
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      </dialog>
    </>
  );
}
