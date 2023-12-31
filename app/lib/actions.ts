"use server";

import { signIn } from "@/auth";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

interface State {
  errors?: {
    id?: string[];
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
}

const InvoiceSchema = z.object({
  id: z.string({
    invalid_type_error: "Invalid ID.",
  }),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: "Amount must be greater than $0." }),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "Please select an invoice status.",
  }),
  date: z.string(),
});

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });
const UpdateInvoice = InvoiceSchema.omit({ date: true });
const DeleteInvoice = InvoiceSchema.pick({ id: true });

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing fields. Failed to create invoice.",
    };
  }

  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = Math.round(amount * 100);
  const date = new Date().toISOString().split("T")[0];

  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function updateInvoice(prevState: State, formData: FormData) {
  const validatedFields = UpdateInvoice.safeParse({
    id: formData.get("id"),
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing fields. Failed to update invoice.",
    };
  }

  const { id, customerId, amount, status } = validatedFields.data;
  const amountInCents = Math.round(amount * 100);

  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    return {
      message: "Database Error: Failed to Update Invoice.",
    };
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(formData: FormData) {
  const { id } = DeleteInvoice.parse({
    id: formData.get("id"),
  });

  try {
    await sql`
    DELETE FROM invoices
    WHERE id = ${id}
  `;
    revalidatePath("/dashboard/invoices");
    return {
      message: "Invoice Deleted.",
    };
  } catch (error) {
    return {
      message: "Database Error: Failed to Delete Invoice.",
    };
  }
}

export async function authenticate(prevState: unknown, formData: FormData) {
  try {
    await signIn("credentials", Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof Error && error.message.includes("CredentialsSignin")) {
      return "CredentialSignin";
    }
    throw error;
  }
}
