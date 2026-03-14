import { Modal, ModalProps } from "antd";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ModalContext = createContext<StaticModal>({} as any);
type deprecatedAttr = "destroyOnClose" | "bodyStyle" | "maskStyle" | "focusTriggerAfterClose";

export type StaticModalProps = Omit<ModalProps, "open" | deprecatedAttr>;
export type StaticModalOpenInfo = {
  id: string;
};
export interface StaticModal {
  /**
   * 点击确定，需要手动传入 onOk 处理关闭
   * 如果想阻止关闭弹窗，可以传入 onCancel:(e)=>  e.preventDefault()
   */
  open: (options: StaticModalProps) => StaticModalOpenInfo;
  /**
   * onOk 如果返回 Promise ，确认按钮会变成loading 状态，直到 Promise 敲定。如果 resolve ，则关闭弹窗，否则不关闭
   *
   * ```ts
   *  confirm({
   *    onOk: async (e)=>{
   *       e.preventDefault() // 可阻止弹窗关闭
   *    }
   *  })
   * ```
   */
  confirm: (options: StaticModalProps) => StaticModalOpenInfo;
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

  const ctrl = useMemo<StaticModal>(() => {
    return {
      open,
      close,
      update,
      closeAll,
      confirm(options) {
        const { onOk } = options;
        const modal = open({
          ...options,
          onOk(e) {
            const result = onOk?.(e) as unknown;
            if (result instanceof Promise) {
              update(modal.id, (props) => ({ ...props, confirmLoading: true }));
              result.then(
                () => {
                  if (e.defaultPrevented) return;
                  close(modal.id);
                },
                () => {
                  update(modal.id, (props) => ({ ...props, confirmLoading: false }));
                },
              );
            }
          },
        });
        return modal;
      },
    };
  }, []);

  return (
    <ModalContext.Provider value={ctrl}>
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
              if (event.isDefaultPrevented()) return;
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
