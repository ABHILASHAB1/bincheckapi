from typing import Optional

class BINService:
    @staticmethod
    def lookup_bin(bin_number: str) -> Optional[dict]:
        """
        Mock BIN lookup engine. In production, this would call external APIs 
        (e.g., Mastercard BIN table, Visa BIN table, or third party BIN provider)
        """
        bin_str = str(bin_number).strip()
        
        if len(bin_str) < 6:
            return None
            
        # Basic parsing logic for demo purposes
        first_digit = bin_str[0]
        brand = "Unknown"
        card_type = "Credit"
        bank = "Global Universal Bank"
        country = "US"
        
        if first_digit == "4":
            brand = "Visa"
            if bin_str.startswith("400000"):
                bank = "Chase Bank"
            elif bin_str.startswith("414720"):
                bank = "Bank of America"
        elif first_digit == "5":
            brand = "Mastercard"
            if bin_str.startswith("510000"):
                bank = "Citi"
        elif first_digit == "3":
            if bin_str.startswith("34") or bin_str.startswith("37"):
                brand = "American Express"
                bank = "American Express"
        elif first_digit == "6":
            brand = "Discover"
            bank = "Discover Financial"

        return {
            "bin": bin_str[:6],
            "brand": brand,
            "type": card_type,
            "level": "Platinum",
            "issuer": bank,
            "country_code": country,
            "country_name": "United States",
            "currency": "USD",
            "is_prepaid": False,
            "is_commercial": False
        }
