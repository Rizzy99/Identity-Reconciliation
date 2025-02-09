import { Request, Response } from "express";
import { findContact, createContact, updateContact, Contact } from "../models/contactModel";

export async function identifyCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      res.status(400).json({ error: "Email or phoneNumber is required" });
      return;
    }

    // Fetch existing contacts from the database
    const existingContacts: Contact[] = await findContact(email, phoneNumber);

    if (existingContacts.length === 0) {
      // Create a new primary contact if no existing contact is found
      const newContact = await createContact({
        email,
        phoneNumber,
        linkPrecedence: "primary",
      });
      res.status(200).json({
        contact: {
          primaryContatctId: newContact.id,
          emails: [newContact.email],
          phoneNumbers: [newContact.phoneNumber],
          secondaryContactIds: [],
        },
      });
      return;
    }

    // Identify the primary contact
    let primaryContact: Contact =
      existingContacts.find((c: Contact) => c.linkPrecedence === "primary") || existingContacts[0];

    // Update secondary contacts
    for (const contact of existingContacts) {
      if (contact.id !== primaryContact.id && contact.linkPrecedence === "primary") {
        await updateContact(contact.id!, primaryContact.id!);
      }
    }

    // Filter secondary contacts
    const secondaryContacts: Contact[] = existingContacts.filter(
      (c: Contact) => c.id !== primaryContact.id
    );

    // Respond with consolidated contact information
    res.status(200).json({
      contact: {
        primaryContatctId: primaryContact.id!,
        emails: [...new Set(existingContacts.map((c: Contact) => c.email).filter(Boolean))],
        phoneNumbers: [...new Set(existingContacts.map((c: Contact) => c.phoneNumber).filter(Boolean))],
        secondaryContactIds: secondaryContacts.map((c: Contact) => c.id!),
      },
    });
  } catch (error) {
    console.error("Error identifying customer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

