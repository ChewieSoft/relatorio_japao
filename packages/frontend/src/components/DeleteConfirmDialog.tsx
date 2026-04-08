/**
 * Diálogo de confirmação de exclusão reutilizável.
 *
 * Baseado no AlertDialog do shadcn/ui (Radix UI) com acessibilidade built-in.
 * Exibe nome da entidade e requer confirmação explícita antes de excluir.
 * Reutilizado para Collaborators, Machines e Software.
 *
 * @param {Object} props
 * @param {boolean} props.open - Controla visibilidade do diálogo.
 * @param {function} props.onConfirm - Callback executado ao confirmar exclusão.
 * @param {function} props.onCancel - Callback executado ao cancelar.
 * @param {string} props.entityName - Nome/identificador da entidade a excluir.
 * @param {boolean} props.isLoading - Desabilita botão de confirmação durante exclusão.
 * @returns {JSX.Element} Diálogo de confirmação renderizado.
 */
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"

interface DeleteConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  entityName: string
  isLoading: boolean
}

const DeleteConfirmDialog = ({ open, onConfirm, onCancel, entityName, isLoading }: DeleteConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel() }}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
        <AlertDialogDescription>
          Tem certeza que deseja excluir <strong>{entityName}</strong>? O registro será desativado.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={isLoading}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Excluir
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

export default DeleteConfirmDialog
