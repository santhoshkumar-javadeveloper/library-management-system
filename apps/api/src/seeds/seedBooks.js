/**
 * Generates 200+ seed books with categories/genres and thumbnail placeholders.
 * Used on server startup and by POST /admin/seed-books.
 * Each book gets a unique ISBN-13 (978-0-99-XXXXXX-Y) for search and catalog.
 */

const COVER_COLORS = [
  '1a365d', '2d3748', '2c5282', '234e52', '553c9a', '744210', '702459', '5a2d0c',
  '1a202c', '2b6cb0', '276749', '6b46c1', '9f7aea', 'c05621', 'c53030', '2f855a',
];

function thumbnailUrl(title, index) {
  const color = COVER_COLORS[index % COVER_COLORS.length];
  const text = encodeURIComponent((title || 'BK').slice(0, 2).toUpperCase());
  return `https://placehold.co/200x280/${color}/e2e8f0?text=${text}`;
}

/** Generate a valid ISBN-13 from a numeric index (978-0-99-XXXXXX-Y). Exported for backfill. */
export function isbn13FromIndex(index) {
  const n = Math.floor(Number(index)) % 1000000;
  const prefix = '978099';
  const mid = String(n).padStart(6, '0');
  const digits = [...(prefix + mid)].map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return `${prefix}${mid}${check}`;
}

/** Unique global number for backfill (BK-BF-XXXXXX). Exported for backfill. */
export function globalNumberFromIndex(index) {
  const n = Math.floor(Number(index)) % 1000000;
  return `BK-BF-${String(n).padStart(6, '0')}`;
}

const BOOKS_BY_CATEGORY = [
  { category: 'Programming', genre: 'Technology', books: [
    { title: 'Clean Code', author: 'Robert C. Martin', copies: 5 },
    { title: 'Design Patterns', author: 'Gang of Four', copies: 3 },
    { title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', copies: 3 },
    { title: 'Refactoring', author: 'Martin Fowler', copies: 2 },
    { title: 'Introduction to Algorithms', author: 'CLRS', copies: 4 },
    { title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', copies: 3 },
    { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', copies: 4 },
    { title: 'You Don\'t Know JS', author: 'Kyle Simpson', copies: 3 },
    { title: 'Effective Java', author: 'Joshua Bloch', copies: 3 },
    { title: 'Head First Design Patterns', author: 'Freeman & Freeman', copies: 2 },
    { title: 'The Clean Coder', author: 'Robert C. Martin', copies: 2 },
    { title: 'Python Crash Course', author: 'Eric Matthes', copies: 4 },
    { title: 'Learning React', author: 'Alex Banks', copies: 3 },
    { title: 'Node.js Design Patterns', author: 'Mario Casciaro', copies: 2 },
    { title: 'System Design Interview', author: 'Alex Xu', copies: 5 },
    { title: 'Database Internals', author: 'Alex Petrov', copies: 2 },
    { title: 'Building Microservices', author: 'Sam Newman', copies: 3 },
    { title: 'Kubernetes in Action', author: 'Marko Luksa', copies: 2 },
    { title: 'Rust in Action', author: 'Tim McNamara', copies: 2 },
  ]},
  { category: 'Computer Science', genre: 'Technology', books: [
    { title: 'Database Systems', author: 'Ramakrishnan', copies: 2 },
    { title: 'Operating Systems', author: 'Silberschatz', copies: 3 },
    { title: 'Computer Networks', author: 'Andrew Tanenbaum', copies: 3 },
    { title: 'Artificial Intelligence', author: 'Russell & Norvig', copies: 2 },
    { title: 'Compilers', author: 'Aho, Lam, Sethi', copies: 2 },
    { title: 'Distributed Systems', author: 'Martin Kleppmann', copies: 2 },
    { title: 'Machine Learning Yearning', author: 'Andrew Ng', copies: 4 },
    { title: 'Deep Learning', author: 'Goodfellow, Bengio', copies: 2 },
    { title: 'Data Structures and Algorithms', author: 'Narasimha Karumanchi', copies: 3 },
    { title: 'The Algorithm Design Manual', author: 'Steven Skiena', copies: 2 },
  ]},
  { category: 'Fiction', genre: 'Literature', books: [
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', copies: 6 },
    { title: '1984', author: 'George Orwell', copies: 5 },
    { title: 'Pride and Prejudice', author: 'Jane Austen', copies: 4 },
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', copies: 4 },
    { title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', copies: 3 },
    { title: 'The Catcher in the Rye', author: 'J.D. Salinger', copies: 4 },
    { title: 'Beloved', author: 'Toni Morrison', copies: 3 },
    { title: 'The Hobbit', author: 'J.R.R. Tolkien', copies: 5 },
    { title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', copies: 4 },
    { title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', copies: 8 },
    { title: 'Harry Potter and the Chamber of Secrets', author: 'J.K. Rowling', copies: 6 },
    { title: 'The Kite Runner', author: 'Khaled Hosseini', copies: 4 },
    { title: 'Life of Pi', author: 'Yann Martel', copies: 3 },
    { title: 'The Alchemist', author: 'Paulo Coelho', copies: 6 },
    { title: 'A Tale of Two Cities', author: 'Charles Dickens', copies: 3 },
    { title: 'Jane Eyre', author: 'Charlotte Brontë', copies: 4 },
    { title: 'Wuthering Heights', author: 'Emily Brontë', copies: 3 },
    { title: 'Brave New World', author: 'Aldous Huxley', copies: 4 },
    { title: 'The Handmaid\'s Tale', author: 'Margaret Atwood', copies: 4 },
    { title: 'Little Women', author: 'Louisa May Alcott', copies: 4 },
  ]},
  { category: 'Mystery', genre: 'Thriller', books: [
    { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', copies: 4 },
    { title: 'Gone Girl', author: 'Gillian Flynn', copies: 5 },
    { title: 'The Da Vinci Code', author: 'Dan Brown', copies: 6 },
    { title: 'Murder on the Orient Express', author: 'Agatha Christie', copies: 4 },
    { title: 'The Silent Patient', author: 'Alex Michaelides', copies: 3 },
    { title: 'Sharp Objects', author: 'Gillian Flynn', copies: 3 },
    { title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', copies: 4 },
    { title: 'And Then There Were None', author: 'Agatha Christie', copies: 5 },
    { title: 'The Murder of Roger Ackroyd', author: 'Agatha Christie', copies: 3 },
    { title: 'The Big Sleep', author: 'Raymond Chandler', copies: 3 },
    { title: 'The Maltese Falcon', author: 'Dashiell Hammett', copies: 3 },
    { title: 'In the Woods', author: 'Tana French', copies: 2 },
    { title: 'The Woman in the Window', author: 'A.J. Finn', copies: 3 },
    { title: 'The Guest List', author: 'Lucy Foley', copies: 3 },
    { title: 'The Thursday Murder Club', author: 'Richard Osman', copies: 4 },
  ]},
  { category: 'Science Fiction', genre: 'Sci-Fi', books: [
    { title: 'Dune', author: 'Frank Herbert', copies: 4 },
    { title: 'Foundation', author: 'Isaac Asimov', copies: 4 },
    { title: 'Ender\'s Game', author: 'Orson Scott Card', copies: 5 },
    { title: 'The Martian', author: 'Andy Weir', copies: 5 },
    { title: 'Project Hail Mary', author: 'Andy Weir', copies: 4 },
    { title: 'Neuromancer', author: 'William Gibson', copies: 3 },
    { title: 'Snow Crash', author: 'Neal Stephenson', copies: 3 },
    { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', copies: 2 },
    { title: 'Hyperion', author: 'Dan Simmons', copies: 3 },
    { title: 'The Three-Body Problem', author: 'Liu Cixin', copies: 4 },
    { title: 'Blade Runner', author: 'Philip K. Dick', copies: 3 },
    { title: 'Do Androids Dream of Electric Sheep?', author: 'Philip K. Dick', copies: 3 },
    { title: 'The Hitchhiker\'s Guide to the Galaxy', author: 'Douglas Adams', copies: 6 },
    { title: 'Ready Player One', author: 'Ernest Cline', copies: 4 },
    { title: 'Children of Time', author: 'Adrian Tchaikovsky', copies: 2 },
  ]},
  { category: 'Romance', genre: 'Fiction', books: [
    { title: 'The Notebook', author: 'Nicholas Sparks', copies: 5 },
    { title: 'Me Before You', author: 'Jojo Moyes', copies: 4 },
    { title: 'Outlander', author: 'Diana Gabaldon', copies: 3 },
    { title: 'Bridgerton: The Duke and I', author: 'Julia Quinn', copies: 4 },
    { title: 'It Ends with Us', author: 'Colleen Hoover', copies: 5 },
    { title: 'The Hating Game', author: 'Sally Thorne', copies: 3 },
    { title: 'Red, White & Royal Blue', author: 'Casey McQuiston', copies: 4 },
    { title: 'Beach Read', author: 'Emily Henry', copies: 3 },
    { title: 'People We Meet on Vacation', author: 'Emily Henry', copies: 3 },
    { title: 'The Love Hypothesis', author: 'Ali Hazelwood', copies: 4 },
    { title: 'Normal People', author: 'Sally Rooney', copies: 4 },
    { title: 'Conversations with Friends', author: 'Sally Rooney', copies: 3 },
    { title: 'The Spanish Love Deception', author: 'Elena Armas', copies: 3 },
    { title: 'Twilight', author: 'Stephenie Meyer', copies: 6 },
    { title: 'Fifty Shades of Grey', author: 'E.L. James', copies: 4 },
  ]},
  { category: 'Biography', genre: 'Non-Fiction', books: [
    { title: 'Steve Jobs', author: 'Walter Isaacson', copies: 4 },
    { title: 'Einstein: His Life and Universe', author: 'Walter Isaacson', copies: 3 },
    { title: 'Becoming', author: 'Michelle Obama', copies: 5 },
    { title: 'Educated', author: 'Tara Westover', copies: 4 },
    { title: 'The Diary of a Young Girl', author: 'Anne Frank', copies: 5 },
    { title: 'Long Walk to Freedom', author: 'Nelson Mandela', copies: 3 },
    { title: 'Wings of Fire', author: 'A.P.J. Abdul Kalam', copies: 4 },
    { title: 'My Experiments with Truth', author: 'Mahatma Gandhi', copies: 3 },
    { title: 'Shoe Dog', author: 'Phil Knight', copies: 4 },
    { title: 'Elon Musk', author: 'Walter Isaacson', copies: 4 },
    { title: 'Benjamin Franklin', author: 'Walter Isaacson', copies: 2 },
    { title: 'Alexander Hamilton', author: 'Ron Chernow', copies: 3 },
    { title: 'Churchill: A Life', author: 'Martin Gilbert', copies: 2 },
    { title: 'The Wright Brothers', author: 'David McCullough', copies: 3 },
    { title: 'I Know Why the Caged Bird Sings', author: 'Maya Angelou', copies: 4 },
  ]},
  { category: 'Business', genre: 'Non-Fiction', books: [
    { title: 'The Lean Startup', author: 'Eric Ries', copies: 5 },
    { title: 'Zero to One', author: 'Peter Thiel', copies: 4 },
    { title: 'Good to Great', author: 'Jim Collins', copies: 4 },
    { title: 'Built to Last', author: 'Jim Collins', copies: 3 },
    { title: 'The Innovator\'s Dilemma', author: 'Clayton Christensen', copies: 3 },
    { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', copies: 4 },
    { title: 'Start with Why', author: 'Simon Sinek', copies: 4 },
    { title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey', copies: 6 },
    { title: 'How to Win Friends and Influence People', author: 'Dale Carnegie', copies: 5 },
    { title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', copies: 5 },
    { title: 'The E-Myth Revisited', author: 'Michael Gerber', copies: 3 },
    { title: 'Crossing the Chasm', author: 'Geoffrey Moore', copies: 2 },
    { title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz', copies: 3 },
    { title: 'Measure What Matters', author: 'John Doerr', copies: 3 },
    { title: 'Influence', author: 'Robert Cialdini', copies: 4 },
  ]},
  { category: 'History', genre: 'Non-Fiction', books: [
    { title: 'Sapiens', author: 'Yuval Noah Harari', copies: 5 },
    { title: 'Homo Deus', author: 'Yuval Noah Harari', copies: 3 },
    { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', copies: 4 },
    { title: 'Collapse', author: 'Jared Diamond', copies: 2 },
    { title: 'A People\'s History of the United States', author: 'Howard Zinn', copies: 3 },
    { title: 'The Rise and Fall of the Third Reich', author: 'William Shirer', copies: 2 },
    { title: 'The Histories', author: 'Herodotus', copies: 2 },
    { title: 'Meditations', author: 'Marcus Aurelius', copies: 4 },
    { title: 'The Art of War', author: 'Sun Tzu', copies: 5 },
    { title: 'The Prince', author: 'Niccolò Machiavelli', copies: 3 },
    { title: '1776', author: 'David McCullough', copies: 3 },
    { title: 'The Wright Brothers', author: 'David McCullough', copies: 2 },
    { title: 'SPQR', author: 'Mary Beard', copies: 2 },
    { title: 'The Silk Roads', author: 'Peter Frankopan', copies: 2 },
    { title: 'The Crusades', author: 'Thomas Asbridge', copies: 2 },
  ]},
  { category: 'Self-Help', genre: 'Non-Fiction', books: [
    { title: 'Atomic Habits', author: 'James Clear', copies: 6 },
    { title: 'The Power of Habit', author: 'Charles Duhigg', copies: 4 },
    { title: 'Deep Work', author: 'Cal Newport', copies: 4 },
    { title: 'Digital Minimalism', author: 'Cal Newport', copies: 3 },
    { title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', copies: 5 },
    { title: 'Daring Greatly', author: 'Brené Brown', copies: 4 },
    { title: 'The Gifts of Imperfection', author: 'Brené Brown', copies: 3 },
    { title: 'Man\'s Search for Meaning', author: 'Viktor Frankl', copies: 5 },
    { title: 'Mindset', author: 'Carol Dweck', copies: 4 },
    { title: 'Grit', author: 'Angela Duckworth', copies: 4 },
    { title: 'Flow', author: 'Mihaly Csikszentmihalyi', copies: 2 },
    { title: 'The 4-Hour Workweek', author: 'Tim Ferriss', copies: 4 },
    { title: 'Essentialism', author: 'Greg McKeown', copies: 3 },
    { title: 'Quiet', author: 'Susan Cain', copies: 3 },
    { title: 'When', author: 'Daniel Pink', copies: 2 },
  ]},
  { category: 'Fantasy', genre: 'Fiction', books: [
    { title: 'A Game of Thrones', author: 'George R.R. Martin', copies: 5 },
    { title: 'The Name of the Wind', author: 'Patrick Rothfuss', copies: 4 },
    { title: 'The Way of Kings', author: 'Brandon Sanderson', copies: 3 },
    { title: 'Mistborn', author: 'Brandon Sanderson', copies: 4 },
    { title: 'The Lies of Locke Lamora', author: 'Scott Lynch', copies: 2 },
    { title: 'The Blade Itself', author: 'Joe Abercrombie', copies: 3 },
    { title: 'The Priory of the Orange Tree', author: 'Samantha Shannon', copies: 2 },
    { title: 'The Poppy War', author: 'R.F. Kuang', copies: 3 },
    { title: 'The Fifth Season', author: 'N.K. Jemisin', copies: 2 },
    { title: 'Good Omens', author: 'Neil Gaiman & Terry Pratchett', copies: 4 },
    { title: 'American Gods', author: 'Neil Gaiman', copies: 3 },
    { title: 'The Ocean at the End of the Lane', author: 'Neil Gaiman', copies: 3 },
    { title: 'The Night Circus', author: 'Erin Morgenstern', copies: 3 },
    { title: 'Jonathan Strange & Mr Norrell', author: 'Susanna Clarke', copies: 2 },
    { title: 'The Witcher: Last Wish', author: 'Andrzej Sapkowski', copies: 3 },
  ]},
  { category: 'Thriller', genre: 'Fiction', books: [
    { title: 'The Girl on the Train', author: 'Paula Hawkins', copies: 5 },
    { title: 'The Silent Patient', author: 'Alex Michaelides', copies: 3 },
    { title: 'The Guest List', author: 'Lucy Foley', copies: 3 },
    { title: 'The Hunting Party', author: 'Lucy Foley', copies: 2 },
    { title: 'Then She Was Gone', author: 'Lisa Jewell', copies: 3 },
    { title: 'The Family Upstairs', author: 'Lisa Jewell', copies: 2 },
    { title: 'The Turn of the Key', author: 'Ruth Ware', copies: 2 },
    { title: 'The Woman in Cabin 10', author: 'Ruth Ware', copies: 3 },
    { title: 'The Couple Next Door', author: 'Shari Lapena', copies: 3 },
    { title: 'A Quiet Place', author: 'Peter Farrelly', copies: 2 },
    { title: 'The Bourne Identity', author: 'Robert Ludlum', copies: 4 },
    { title: 'The Day of the Jackal', author: 'Frederick Forsyth', copies: 2 },
    { title: 'The Firm', author: 'John Grisham', copies: 4 },
    { title: 'The Pelican Brief', author: 'John Grisham', copies: 3 },
    { title: 'The Da Vinci Code', author: 'Dan Brown', copies: 4 },
  ]},
  { category: 'Cooking', genre: 'Lifestyle', books: [
    { title: 'Salt, Fat, Acid, Heat', author: 'Samin Nosrat', copies: 3 },
    { title: 'The Joy of Cooking', author: 'Irma S. Rombauer', copies: 4 },
    { title: 'How to Cook Everything', author: 'Mark Bittman', copies: 3 },
    { title: 'Mastering the Art of French Cooking', author: 'Julia Child', copies: 2 },
    { title: 'The Food Lab', author: 'J. Kenji López-Alt', copies: 2 },
    { title: 'On Food and Cooking', author: 'Harold McGee', copies: 2 },
    { title: 'Plenty', author: 'Yotam Ottolenghi', copies: 3 },
    { title: 'Six Seasons', author: 'Joshua McFadden', copies: 2 },
    { title: 'Dessert Person', author: 'Claire Saffitz', copies: 2 },
    { title: 'Bread Baking for Beginners', author: 'Bonnie Ohara', copies: 3 },
  ]},
  { category: 'Science', genre: 'Non-Fiction', books: [
    { title: 'A Brief History of Time', author: 'Stephen Hawking', copies: 5 },
    { title: 'Cosmos', author: 'Carl Sagan', copies: 4 },
    { title: 'The Selfish Gene', author: 'Richard Dawkins', copies: 4 },
    { title: 'The Gene', author: 'Siddhartha Mukherjee', copies: 3 },
    { title: 'The Emperor of All Maladies', author: 'Siddhartha Mukherjee', copies: 3 },
    { title: 'Pale Blue Dot', author: 'Carl Sagan', copies: 2 },
    { title: 'Astrophysics for People in a Hurry', author: 'Neil deGrasse Tyson', copies: 5 },
    { title: 'The Body', author: 'Bill Bryson', copies: 4 },
    { title: 'A Short History of Nearly Everything', author: 'Bill Bryson', copies: 4 },
    { title: 'The Immortal Life of Henrietta Lacks', author: 'Rebecca Skloot', copies: 3 },
  ]},
  { category: 'Poetry', genre: 'Literature', books: [
    { title: 'Milk and Honey', author: 'Rupi Kaur', copies: 5 },
    { title: 'The Sun and Her Flowers', author: 'Rupi Kaur', copies: 4 },
    { title: 'Leaves of Grass', author: 'Walt Whitman', copies: 3 },
    { title: 'The Waste Land', author: 'T.S. Eliot', copies: 2 },
    { title: 'Selected Poems', author: 'Emily Dickinson', copies: 3 },
    { title: 'The Prophet', author: 'Kahlil Gibran', copies: 5 },
    { title: 'Ariel', author: 'Sylvia Plath', copies: 2 },
    { title: 'Twenty Love Poems', author: 'Pablo Neruda', copies: 3 },
    { title: 'Devotions', author: 'Mary Oliver', copies: 3 },
    { title: 'The Hill We Climb', author: 'Amanda Gorman', copies: 4 },
  ]},
  { category: 'Travel', genre: 'Lifestyle', books: [
    { title: 'Into the Wild', author: 'Jon Krakauer', copies: 4 },
    { title: 'In a Sunburned Country', author: 'Bill Bryson', copies: 3 },
    { title: 'A Walk in the Woods', author: 'Bill Bryson', copies: 4 },
    { title: 'The Geography of Bliss', author: 'Eric Weiner', copies: 2 },
    { title: 'Vagabonding', author: 'Rolf Potts', copies: 2 },
    { title: 'Wild', author: 'Cheryl Strayed', copies: 4 },
    { title: 'Eat, Pray, Love', author: 'Elizabeth Gilbert', copies: 5 },
    { title: 'The Alchemist', author: 'Paulo Coelho', copies: 4 },
    { title: 'Shantaram', author: 'Gregory David Roberts', copies: 3 },
    { title: 'The Beach', author: 'Alex Garland', copies: 2 },
  ]},
  { category: 'Children', genre: 'Young Readers', books: [
    { title: 'Where the Wild Things Are', author: 'Maurice Sendak', copies: 6 },
    { title: 'The Very Hungry Caterpillar', author: 'Eric Carle', copies: 8 },
    { title: 'Goodnight Moon', author: 'Margaret Wise Brown', copies: 5 },
    { title: 'Charlotte\'s Web', author: 'E.B. White', copies: 5 },
    { title: 'Matilda', author: 'Roald Dahl', copies: 4 },
    { title: 'Charlie and the Chocolate Factory', author: 'Roald Dahl', copies: 5 },
    { title: 'The Chronicles of Narnia', author: 'C.S. Lewis', copies: 4 },
    { title: 'The Phantom Tollbooth', author: 'Norton Juster', copies: 3 },
    { title: 'Wonder', author: 'R.J. Palacio', copies: 5 },
    { title: 'The Giving Tree', author: 'Shel Silverstein', copies: 6 },
  ]},
  { category: 'Horror', genre: 'Fiction', books: [
    { title: 'It', author: 'Stephen King', copies: 4 },
    { title: 'The Shining', author: 'Stephen King', copies: 4 },
    { title: 'Pet Sematary', author: 'Stephen King', copies: 3 },
    { title: 'Carrie', author: 'Stephen King', copies: 3 },
    { title: 'The Exorcist', author: 'William Peter Blatty', copies: 2 },
    { title: 'Dracula', author: 'Bram Stoker', copies: 4 },
    { title: 'Frankenstein', author: 'Mary Shelley', copies: 4 },
    { title: 'The Haunting of Hill House', author: 'Shirley Jackson', copies: 2 },
    { title: 'We Have Always Lived in the Castle', author: 'Shirley Jackson', copies: 2 },
    { title: 'The Turn of the Screw', author: 'Henry James', copies: 2 },
  ]},
];

function buildSeedBooks() {
  let index = 0;
  const out = [];
  for (const { category, genre, books } of BOOKS_BY_CATEGORY) {
    for (const { title, author, copies } of books) {
      out.push({
        title,
        author,
        category,
        genre,
        totalCopies: copies,
        availableCopies: copies,
        thumbnailUrl: thumbnailUrl(title, index),
        loanPeriodDays: 10,
        isbn: isbn13FromIndex(index),
      });
      index += 1;
    }
  }
  return out;
}

export const SEED_BOOKS = buildSeedBooks();

/** Expand base seed to at least minCount books (for fresh reset with 1000+). Repeats with " — Vol. N" suffix. */
export function getExpandedSeedBooks(minCount = 1000) {
  const base = buildSeedBooks();
  if (base.length >= minCount) return base;
  const out = [...base];
  let round = 2;
  while (out.length < minCount) {
    for (let i = 0; i < base.length && out.length < minCount; i++) {
      const b = base[i];
      out.push({
        title: `${b.title} — Vol. ${round}`,
        author: b.author,
        category: b.category,
        genre: b.genre,
        totalCopies: b.totalCopies,
        availableCopies: b.availableCopies,
        thumbnailUrl: thumbnailUrl(b.title, out.length),
        loanPeriodDays: b.loanPeriodDays,
        isbn: isbn13FromIndex(out.length),
      });
    }
    round += 1;
  }
  return out;
}
