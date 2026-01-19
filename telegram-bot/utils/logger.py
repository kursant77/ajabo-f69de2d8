"""
Logging configuration for the Telegram bot.
"""
import logging
import sys
from datetime import datetime


def setup_logger(name: str = "telegram_bot") -> logging.Logger:
    """
    Set up and configure logger for the application.
    
    Args:
        name: Logger name
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Create file handler for production
    try:
        import os
        log_dir = "logs"
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
            
        file_handler = logging.FileHandler(f"{log_dir}/bot.log", encoding='utf-8')
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except Exception as e:
        print(f"Could not setup file logging: {e}")
    
    return logger


# Create default logger instance
logger = setup_logger()
