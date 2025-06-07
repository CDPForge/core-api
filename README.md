# Core API

This project provides a complete backend API for the CDP Forge platform. The system is designed to handle and analyze different types of data, including clicks, purchases, views, and real-time metrics.

## Main Features

- **Click Analytics**: Click tracking and analysis with target-based grouping
- **Purchase Analytics**: Detailed purchase metrics with grouping by device, browser, product, brand, category, and city
- **Real-time Metrics**: Active visitor monitoring with details by country, page, and browser
- **Interest Analytics**: User interest tracking with topic-based grouping
- **View Analytics**: Detailed view metrics with grouping by device, browser, operating system, referrer, and geolocation
- **Bulk Support**: Most APIs support bulk operations for efficient data handling

## Technical Requirements

- Node.js (version 14 or higher)
- MongoDB
- Redis (for real-time metrics)

## Installation

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start the server
npm start
```

## API Documentation

For detailed documentation of all available APIs, please refer to the [API.md](API.md) file.

## Project Structure

```
be-api/
├── src/
│   ├── controllers/    # API request handlers
│   ├── models/        # Data models
│   └── utils/         # Utilities and helpers
├── tests/             # Unit and integration tests
├── API.md            # Detailed API documentation
└── README.md         # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/feature-name`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/feature-name`)
5. Create a Pull Request

## License

This project is released under the MIT License. See the `LICENSE` file for more details. 