import * as React from "react";
import { cn } from "../../lib/utils";

export interface FormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, ...props }, ref) => {
    return <form ref={ref} className={cn(className)} {...props} />;
  }
);

Form.displayName = "Form";

export default Form;


