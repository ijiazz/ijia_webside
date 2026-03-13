import { Modal, ModalProps } from "antd";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ModalContext = createContext<StaticModal>({} as any);
type deprecatedAttr = "destroyOnClose" | "bodyStyle" | "maskStyle" | "focusTriggerAfterClose";

export type StaticModalProps = Omit<ModalProps, "open" | deprecatedAttr>;
export type StaticModalOpenInfo = {
  id: string;
};
export interface StaticModal {
  open: (options: StaticModalProps) => StaticModalOpenInfo;
  close: (id: string) => void;
  update: (id: string, options: StaticModalProps | ((prev: StaticModalProps) => StaticModalProps)) => void;
  closeAll: () => void;
}
export function useModal() {
  return useContext(ModalContext);
}

type ManagedModal = {
  id: string;
  open: boolean;
  options: StaticModalProps;
};

let modalIdCounter = 0;
function createModalId() {
  return `modal-${modalIdCounter++}`;
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<ManagedModal[]>([]);

  const close = useCallback((id: string) => {
    setModals((prev) => prev.map((item) => (item.id === id ? { ...item, open: false } : item)));
  }, []);

  const closeAll = useCallback(() => {
    setModals((prev) => prev.map((item) => ({ ...item, open: false })));
  }, []);

  const update = useCallback(
    (id: string, options: StaticModalProps | ((prev: StaticModalProps) => StaticModalProps)) => {
      setModals((prev) => {
        return prev.map((item) =>
          item.id === id
            ? {
                ...item,
                options: typeof options === "function" ? options(item.options) : options,
              }
            : item,
        );
      });
    },
    [],
  );

  const open = useCallback((options: StaticModalProps): StaticModalOpenInfo => {
    const id = createModalId();
    setModals((prev) => [...prev, { id, open: true, options }]);
    return { id };
  }, []);

  const value = useMemo<StaticModal>(() => ({ open, close, update, closeAll }), []);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modals.map(({ id, open, options }) => {
        const { onCancel, afterOpenChange } = options;

        return (
          <Modal
            key={id}
            {...options}
            open={open}
            onCancel={(event) => {
              onCancel?.(event);
              close(id);
            }}
            afterOpenChange={(visible) => {
              afterOpenChange?.(visible);
              if (!visible) {
                setModals((prev) => prev.filter((item) => item.id !== id));
              }
            }}
          />
        );
      })}
    </ModalContext.Provider>
  );
}
