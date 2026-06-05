/**
 * Helper to fetch city and area details based on Indian pincode
 * uses the free postalpincode.in API
 */
export interface PincodeDetails {
  city: string;
  area: string;
}

export const fetchAddressByPincode = async (pincode: string): Promise<PincodeDetails | null> => {
  const cleanPincode = pincode.replace(/\D/g, "");
  if (cleanPincode.length !== 6) return null;

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`);
    const data = await response.json();

    if (
      data &&
      data[0] &&
      data[0].Status === "Success" &&
      data[0].PostOffice &&
      data[0].PostOffice.length > 0
    ) {
      const office = data[0].PostOffice[0];
      return {
        city: office.District || office.Division || office.Circle || "",
        area: office.Name || "",
      };
    }
  } catch (error) {
    console.error("Error fetching pincode details:", error);
  }
  return null;
};
