import re
from typing import Optional

class ValidationUtils:
    @staticmethod
    def validate_email(email: str) -> bool:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_password(password: str) -> tuple[bool, Optional[str]]:
        if len(password) < 8:
            return False, "Password must be at least 8 characters"
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        if not re.search(r'\d', password):
            return False, "Password must contain at least one digit"
        return True, None
    
    @staticmethod
    def validate_symbol(symbol: str) -> bool:
        pattern = r'^[A-Z]{1,5}$'
        return re.match(pattern, symbol) is not None
    
    @staticmethod
    def validate_quantity(quantity: float) -> bool:
        return quantity > 0
    
    @staticmethod
    def validate_price(price: float) -> bool:
        return price > 0
