export interface Todo {
    _id: number;
    title: string;
    description: string;
}
export interface ModalProps {
    closeModal: () => void;
    onSubmit: (title: string, description: string) => void;
}