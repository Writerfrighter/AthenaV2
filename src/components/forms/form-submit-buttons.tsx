import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FormSubmitButtonsProps {
  isEditMode: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onClear: () => void;
  onSubmit: () => void;
  submitText: string;
  updateText: string;
}

export function FormSubmitButtons({
  isEditMode,
  isSubmitting,
  onCancel,
  onClear,
  onSubmit,
  submitText,
  updateText,
}: FormSubmitButtonsProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <>
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear form?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all fields to their default values. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClear();
                setShowClearConfirm(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="border rounded-xl shadow-sm sm:py-4">
        <CardContent className="">
          {isEditMode ? (
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Update the entry and return to dashboard
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="hover:bg-green-50 h-10"
                  size="lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="min-w-[140px] h-10 bg-green-600 hover:bg-green-700 text-base"
                  size="lg"
                >
                  {isSubmitting ? (
                    "Updating..."
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {updateText}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <div className="flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowClearConfirm(true)}
                  className="hover:bg-green-50 h-10 w-full md:w-auto"
                  size="lg"
                >
                  Clear Form
                </Button>
              </div>
              <div className="text-sm text-muted-foreground text-center flex-1">
                Data saves locally and syncs automatically
              </div>
              <div className="flex-shrink-0">
                <Button
                  onClick={onSubmit}
                  disabled={isSubmitting}
                  className="min-w-[140px] h-10 bg-green-600 hover:bg-green-700 text-base w-full md:w-auto"
                  size="lg"
                >
                  {isSubmitting ? (
                    "Saving..."
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {submitText}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
