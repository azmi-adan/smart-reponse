from flask import Flask, render_template, request, jsonify, session
import datetime
import re
import uuid

app = Flask(__name__)
app.secret_key = 'your-secret-key-here-change-in-production'

# In-memory storage (resets when server restarts)
# In a real app, you'd use a database
inquiries = []

@app.route('/')
def index():
    """Render the main dashboard"""
    return render_template('index.html', inquiries=inquiries)

@app.route('/simulate', methods=['POST'])
def simulate_message():
    """Handle customer message simulation"""
    message = request.form.get('message', '').strip()
    
    if not message:
        return render_template('index.html', 
                             inquiries=inquiries,
                             error="Please enter a message")
    
    # Process the message through automation logic
    category, response, confidence = categorize_inquiry(message)
    
    # Create inquiry record
    inquiry = {
        'id': str(uuid.uuid4())[:8],  # Short unique ID
        'message': message,
        'category': category,
        'response': response,
        'confidence': confidence,
        'timestamp': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'status': 'escalated' if category == 'complex' else 'resolved'
    }
    
    inquiries.append(inquiry)
    
    # Keep only last 20 for display
    recent_inquiries = inquiries[-20:]
    
    return render_template('index.html', 
                         inquiries=recent_inquiries,
                         last_message=message,
                         last_response=response,
                         last_category=category)

@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    """API endpoint for AJAX requests"""
    data = request.json
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({'error': 'No message provided'}), 400
    
    category, response, confidence = categorize_inquiry(message)
    
    # Create inquiry record for API calls too
    inquiry = {
        'id': str(uuid.uuid4())[:8],
        'message': message,
        'category': category,
        'response': response,
        'confidence': confidence,
        'timestamp': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'status': 'escalated' if category == 'complex' else 'resolved'
    }
    
    inquiries.append(inquiry)
    
    return jsonify({
        'success': True,
        'message': message,
        'category': category,
        'response': response,
        'confidence': confidence,
        'timestamp': datetime.datetime.now().isoformat(),
        'inquiry_id': inquiry['id']
    })

@app.route('/clear', methods=['POST'])
def clear_log():
    """Clear the inquiry log (for testing)"""
    inquiries.clear()
    return render_template('index.html', inquiries=[])

def categorize_inquiry(message):
    """
    Core automation logic - categorizes messages and generates responses
    This simulates the AI/ML classification in a real system
    """
    message_lower = message.lower()
    
    # Pattern matching rules (simulates AI classification)
    rules = {
        'pricing': {
            'patterns': [r'price', r'cost', r'how much', r'pricing', r'rate', r'fee', r'charged?'],
            'response': "Our pricing starts at $400 USD for basic packages. Premium options are available from $650. Would you like me to send you our price list?",
            'confidence': 0.95
        },
        'hours': {
            'patterns': [r'open', r'hours', r'close', r'operating', r'business hours', r'when.*(open|close)'],
            'response': "We're open Monday-Friday 9:00 AM - 8:00 PM, Saturday 10:00 AM - 6:00 PM. We're closed on Sundays and public holidays.",
            'confidence': 0.92
        },
        'delivery': {
            'patterns': [r'delivery', r'shipping', r'send', r'courier', r'dispatch', r'arrive'],
            'response': "Yes, we offer delivery within 5 miles for $5. Free delivery on orders over $50. Standard shipping takes 2-3 business days.",
            'confidence': 0.94
        },
        'greeting': {
            'patterns': [r'hello', r'hi', r'hey', r'greetings', r'good (morning|afternoon|evening)'],
            'response': "Hello! 👋 Thank you for contacting us. How can I assist you today? You can ask about pricing, hours, or delivery.",
            'confidence': 0.98
        },
        'complaint': {
            'patterns': [r'complaint', r'issue', r'problem', r'not working', r'broken', r'bad', r'terrible'],
            'response': "I'm sorry to hear you're experiencing an issue. I'll escalate this to our support team immediately. A representative will contact you within 2 hours.",
            'confidence': 0.88
        },
        'product': {
            'patterns': [r'product', r'item', r'what.*have', r'available', r'stock', r'sell'],
            'response': "We offer a wide range of products including electronics, accessories, and home goods. Could you specify what you're looking for?",
            'confidence': 0.85
        },
        'complex': {
            'patterns': [r'refund', r'return', r'cancel', r'speak to (human|person|agent|manager)', r'complicated'],
            'response': "I understand this requires human assistance. I've notified a support agent who will help you shortly. Your case ID is #" + str(uuid.uuid4())[:6],
            'confidence': 0.90
        }
    }
    
    # Check each rule
    for category, rule in rules.items():
        for pattern in rule['patterns']:
            if re.search(pattern, message_lower):
                return category, rule['response'], rule['confidence']
    
    # Default response for uncategorized messages
    return ('general', 
            "Thank you for your message. A customer service representative will respond within 24 hours. For faster assistance, please visit our FAQ page.",
            0.75)

@app.route('/stats')
def get_stats():
    """Get automation statistics for dashboard"""
    if not inquiries:
        return jsonify({'total': 0})
    
    categories = {}
    for inquiry in inquiries:
        cat = inquiry['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    return jsonify({
        'total': len(inquiries),
        'categories': categories,
        'last_update': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)