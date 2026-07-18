import re

class ValidationService:
    @staticmethod
    def validate_routing_number(routing_number: str) -> dict:
        """
        Validates US ABA Routing Numbers using the modulus 10 checksum algorithm.
        """
        routing_str = str(routing_number).strip()
        
        if not re.match(r'^\d{9}$', routing_str):
            return {
                "is_valid": False,
                "error": "Routing number must be exactly 9 digits."
            }
            
        n = [int(x) for x in routing_str]
        checksum = (3 * (n[0] + n[3] + n[6]) + 
                    7 * (n[1] + n[4] + n[7]) + 
                    1 * (n[2] + n[5] + n[8])) % 10
                    
        is_valid = checksum == 0
        
        return {
            "is_valid": is_valid,
            "routing_number": routing_str,
            "error": None if is_valid else "Invalid routing number checksum."
        }

    @staticmethod
    def validate_iban(iban: str) -> dict:
        """
        Validates International Bank Account Numbers using the ISO 13616 Mod 97 algorithm.
        """
        iban_str = str(iban).strip().upper().replace(" ", "")
        
        if len(iban_str) < 15 or len(iban_str) > 34:
            return {
                "is_valid": False,
                "error": "IBAN length must be between 15 and 34 characters."
            }
            
        if not re.match(r'^[A-Z]{2}\d{2}[A-Z0-9]+$', iban_str):
            return {
                "is_valid": False,
                "error": "Invalid IBAN format."
            }
            
        # Move first 4 characters to the end
        rearranged = iban_str[4:] + iban_str[:4]
        
        # Convert letters to numbers (A=10, B=11, ..., Z=35)
        numeric_iban = ""
        for char in rearranged:
            if char.isalpha():
                numeric_iban += str(ord(char) - 55)
            else:
                numeric_iban += char
                
        # Modulus 97 check
        try:
            is_valid = int(numeric_iban) % 97 == 1
        except ValueError:
            is_valid = False
            
        return {
            "is_valid": is_valid,
            "iban": iban_str,
            "country_code": iban_str[:2],
            "error": None if is_valid else "Invalid IBAN checksum."
        }
