import { useRef } from 'react'
import { Icon } from './Icon'

export function ResetButton({ onReset }: { onReset: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  return (
    <>
      <button type="button" className="icon-button reset-button" onClick={() => dialog.current?.showModal()} aria-label="Réinitialiser" title="Réinitialiser">
        <Icon name="reset" />
        <span className="reset-label">Réinitialiser</span>
      </button>
      <dialog
        ref={dialog}
        className="confirm"
        aria-labelledby="reset-title"
        // Closing hands focus back to the opener, where Enter would reopen the dialog.
        onClose={() => document.getElementById('question')?.focus({ preventScroll: true })}
      >
        <h2 id="reset-title" className="font-serif text-2xl font-semibold">Tout réinitialiser ?</h2>
        <p className="mt-2 text-muted">Les 45 cases repassent en gris, la série et le taux de réussite repartent de zéro.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="button button-quiet" autoFocus onClick={() => dialog.current?.close()}>Annuler</button>
          <button
            type="button"
            className="button button-danger"
            onClick={() => {
              dialog.current?.close()
              onReset()
            }}
          >
            Réinitialiser
          </button>
        </div>
      </dialog>
    </>
  )
}
