import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomerAuthService, type Customer } from "@/services/customer-auth-service";
import { StorefrontProvider } from "@/providers/storefront-provider";
import ProfileSetupPage from "@/app/profile/setup/page";
import ProfilePage from "@/app/profile/page";

describe("Frontend Customer Profile System & Setup Guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const incompleteCustomer: Customer = {
    id: "cust-incomplete-1",
    email: "newbuyer@peralagae.com",
    fullName: "Priyanka Nair",
    role: "customer",
    isEmailVerified: true,
    isProfileComplete: false,
    profile: null,
    createdAt: new Date().toISOString(),
  };

  const completeCustomer: Customer = {
    id: "cust-complete-1",
    email: "vipbuyer@peralagae.com",
    fullName: "Vikram Singhania",
    role: "customer",
    isEmailVerified: true,
    isProfileComplete: true,
    profile: {
      recipientName: "Vikram Singhania",
      phone: "9876543210",
      streetAddress: "74, Bandra Kurla Complex",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400051",
      country: "India",
      isComplete: true,
    },
    createdAt: new Date().toISOString(),
  };

  describe("1. Profile Setup Page (/profile/setup)", () => {
    it("renders setup form with read-only email and prefilled full name for incomplete profile", async () => {
      vi.spyOn(CustomerAuthService, "getMe").mockResolvedValue(incompleteCustomer);

      render(
        <StorefrontProvider>
          <ProfileSetupPage />
        </StorefrontProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Complete Your Profile")).toBeInTheDocument();
        const emailInput = screen.getByTestId("profile-email-input") as HTMLInputElement;
        expect(emailInput.value).toBe("newbuyer@peralagae.com");
        expect(emailInput).toBeDisabled();

        const nameInput = screen.getByTestId("profile-fullname-input") as HTMLInputElement;
        expect(nameInput.value).toBe("Priyanka Nair");

        const countryInput = screen.getByTestId("profile-country-input") as HTMLInputElement;
        expect(countryInput.value).toBe("India");
        expect(countryInput).toBeDisabled();
      });
    });

    it("validates Indian phone number and PIN code before saving", async () => {
      vi.spyOn(CustomerAuthService, "getMe").mockResolvedValue(incompleteCustomer);
      const saveSpy = vi.spyOn(CustomerAuthService, "saveProfile");

      render(
        <StorefrontProvider>
          <ProfileSetupPage />
        </StorefrontProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Complete Your Profile")).toBeInTheDocument();
      });

      // Enter invalid phone
      fireEvent.change(screen.getByTestId("profile-phone-input"), {
        target: { value: "12345" },
      });
      fireEvent.blur(screen.getByTestId("profile-phone-input"));

      expect(
        screen.getByText(/Please enter a valid 10-digit Indian mobile number/i)
      ).toBeInTheDocument();

      // Enter invalid PIN
      fireEvent.change(screen.getByTestId("profile-pincode-input"), {
        target: { value: "0123" },
      });
      fireEvent.blur(screen.getByTestId("profile-pincode-input"));

      expect(
        screen.getByText(/Please enter a valid 6-digit Indian PIN code/i)
      ).toBeInTheDocument();

      // Attempt submit
      fireEvent.click(screen.getByTestId("save-profile-button"));
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it("successfully saves complete profile with valid Indian address and updates context", async () => {
      vi.spyOn(CustomerAuthService, "getMe").mockResolvedValue(incompleteCustomer);
      const saveSpy = vi.spyOn(CustomerAuthService, "saveProfile").mockResolvedValue({
        id: "cust-incomplete-1",
        email: "newbuyer@peralagae.com",
        fullName: "Priyanka Nair",
        isProfileComplete: true,
        profile: {
          recipientName: "Priyanka Nair",
          phone: "9876543210",
          streetAddress: "12, Marine Drive",
          city: "Mumbai",
          state: "Maharashtra",
          pinCode: "400020",
          country: "India",
          isComplete: true,
        },
      });

      render(
        <StorefrontProvider>
          <ProfileSetupPage />
        </StorefrontProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Complete Your Profile")).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId("profile-phone-input"), {
        target: { value: "9876543210" },
      });
      fireEvent.change(screen.getByTestId("profile-street-input"), {
        target: { value: "12, Marine Drive" },
      });
      fireEvent.change(screen.getByTestId("profile-city-input"), {
        target: { value: "Mumbai" },
      });
      fireEvent.change(screen.getByTestId("profile-state-select"), {
        target: { value: "Maharashtra" },
      });
      fireEvent.change(screen.getByTestId("profile-pincode-input"), {
        target: { value: "400020" },
      });

      fireEvent.click(screen.getByTestId("save-profile-button"));

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalledWith({
          fullName: "Priyanka Nair",
          recipientName: "Priyanka Nair",
          phone: "9876543210",
          streetAddress: "12, Marine Drive",
          city: "Mumbai",
          state: "Maharashtra",
          pinCode: "400020",
          country: "India",
        });
      });
    });

    it("displays 'Your Profile is Already Complete' when accessed with complete profile", async () => {
      vi.spyOn(CustomerAuthService, "getMe").mockResolvedValue(completeCustomer);

      render(
        <StorefrontProvider>
          <ProfileSetupPage />
        </StorefrontProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Your Profile is Already Complete")).toBeInTheDocument();
        expect(screen.getByText("View & Edit Profile")).toBeInTheDocument();
      });
    });
  });

  describe("2. Profile View & Edit Page (/profile)", () => {
    it("renders saved profile details in view mode with read-only indicators", async () => {
      vi.spyOn(CustomerAuthService, "getMe").mockResolvedValue(completeCustomer);

      render(
        <StorefrontProvider>
          <ProfilePage />
        </StorefrontProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("profile-view-fullname")).toHaveTextContent("Vikram Singhania");
        expect(screen.getByTestId("profile-view-email")).toHaveTextContent("vipbuyer@peralagae.com");
        expect(screen.getByTestId("profile-view-recipient")).toHaveTextContent("Vikram Singhania");
        expect(screen.getByTestId("profile-view-phone")).toHaveTextContent("+91 9876543210");
        expect(screen.getByTestId("profile-view-address")).toHaveTextContent("74, Bandra Kurla Complex");
      });
    });

    it("toggles edit mode, allows editing shipping details, and cancels without saving", async () => {
      vi.spyOn(CustomerAuthService, "getMe").mockResolvedValue(completeCustomer);
      const saveSpy = vi.spyOn(CustomerAuthService, "saveProfile");

      render(
        <StorefrontProvider>
          <ProfilePage />
        </StorefrontProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("edit-profile-button")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("edit-profile-button"));

      expect(screen.getByText("Edit Profile & Address")).toBeInTheDocument();

      // Modify recipient name
      const recipientInput = screen.getByTestId("profile-edit-recipient-input") as HTMLInputElement;
      fireEvent.change(recipientInput, { target: { value: "Vikram S." } });
      expect(recipientInput.value).toBe("Vikram S.");

      // Cancel edit
      fireEvent.click(screen.getByTestId("cancel-profile-edit-button"));

      // Returned to view mode without calling saveProfile
      expect(screen.queryByText("Edit Profile & Address")).not.toBeInTheDocument();
      expect(saveSpy).not.toHaveBeenCalled();
      expect(screen.getByTestId("profile-view-recipient")).toHaveTextContent("Vikram Singhania");
    });

    it("saves edited profile changes to MongoDB and returns to view mode", async () => {
      vi.spyOn(CustomerAuthService, "getMe").mockResolvedValue(completeCustomer);
      const saveSpy = vi.spyOn(CustomerAuthService, "saveProfile").mockResolvedValue({
        id: "cust-complete-1",
        email: "vipbuyer@peralagae.com",
        fullName: "Vikram Singhania",
        isProfileComplete: true,
        profile: {
          recipientName: "Vikram S. Updated",
          phone: "9876543210",
          streetAddress: "74, Bandra Kurla Complex",
          city: "Mumbai",
          state: "Maharashtra",
          pinCode: "400051",
          country: "India",
          isComplete: true,
        },
      });

      render(
        <StorefrontProvider>
          <ProfilePage />
        </StorefrontProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("edit-profile-button")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("edit-profile-button"));

      fireEvent.change(screen.getByTestId("profile-edit-recipient-input"), {
        target: { value: "Vikram S. Updated" },
      });

      fireEvent.click(screen.getByTestId("save-profile-changes-button"));

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            recipientName: "Vikram S. Updated",
          })
        );
        expect(screen.getByText("Profile updated successfully!")).toBeInTheDocument();
      });
    });
  });
});
