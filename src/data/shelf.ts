// The shelf. Two lists. The unread one is meant to be the longer.
// The note under each book is a line, not a synopsis. Lowercase, like the writing.

export interface Book {
  title: string;
  author: string;
  note?: string;
  reading?: boolean;   // unread list only: currently reading
}

// Books Kanishk has read.
export const read: Book[] = [
  { title: 'Normal People', author: 'Sally Rooney', note: 'telling each other everything is not the same as being known.' },
  { title: 'Conversations with Friends', author: 'Sally Rooney', note: 'everyone too clever to say the true thing.' },
  { title: 'White Nights', author: 'Fyodor Dostoevsky', note: 'a man grateful for four days because he had nothing to compare them to.' },
  { title: 'The Metamorphosis', author: 'Franz Kafka', note: 'the horror was never the insect.' },
  { title: 'Letters to Milena', author: 'Franz Kafka', note: 'love letters from a man who asked for the rest to be burned.' },
  { title: 'The Letters of Vincent van Gogh', author: 'Vincent van Gogh', note: 'a painter explaining himself to his brother, in case it mattered later.' },
  { title: 'The Raven', author: 'Edgar Allan Poe', note: 'grief that learned to knock.' },
  { title: 'The Catcher in the Rye', author: 'J.D. Salinger', note: 'everyone grows out of it and pretends they were never in it.' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', note: 'a whole life arranged to be seen by one person.' },
  { title: 'Pride and Prejudice', author: 'Jane Austen', note: 'two people talking themselves out of it for three hundred pages.' },
  { title: 'Wuthering Heights', author: 'Emily Brontë', note: 'not a love story. a haunting they both agreed to.' },
  { title: 'The Importance of Being Earnest', author: 'Oscar Wilde', note: 'the funniest way anyone has said nothing matters.' },
  { title: 'The Fault in Our Stars', author: 'John Green', note: 'it wants you to cry and you do.' },
  { title: 'Chemical Hearts', author: 'Krystal Sutherland', note: 'first love as a chemical accident.' },
  { title: 'Thirteen Reasons Why', author: 'Jay Asher', note: 'small cruelties, and the sum of them.' },
  { title: 'Fool Me Twice', author: 'Nona Uppal', note: 'falling for someone again, which is harder than the first time.' },
  { title: 'Origin', author: 'Dan Brown', note: 'a puzzle box. i finished it anyway.' },
  { title: 'The Archer', author: 'Paulo Coelho', note: 'a small book about aiming that isn\'t about archery.' },
  { title: 'Harry Potter', author: 'J.K. Rowling', note: 'the whole series. where the reading started.' },
  { title: 'Meditations', author: 'Marcus Aurelius', note: 'an emperor talking himself into getting up.' },
  { title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', note: 'an obvious thing i needed said loudly.' },
  { title: 'The Stories of Rumi', author: 'Jalaluddin Rumi', note: 'god written about like someone who left.' },
  { title: 'Rashmirathi', author: 'Ramdhari Singh Dinkar', note: 'karna, finally given the anger he was owed.' },
  { title: 'Godaan', author: 'Munshi Premchand', note: 'the debt that outlives the man.' },
];

export const readMore = 'and many more i couldn\'t pin down on the shelf.';

// The unread shelf - the list of the men i intended to become. Some are ongoing.
export const unread: Book[] = [
  { title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', note: 'everyone says it will finish me. i believe them.' },
  { title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', note: 'i know the whole plot and still haven\'t opened it.' },
  { title: 'A Little Life', author: 'Hanya Yanagihara', note: 'kept away on purpose. i\'ve been warned.' },
  { title: 'Intermezzo', author: 'Sally Rooney', note: 'rooney again. saving it.' },
  { title: 'Frankenstein', author: 'Mary Shelley', note: 'the monster reads more than the doctor. that\'s the part i want.', reading: true },
  { title: 'The Prophet', author: 'Kahlil Gibran', note: 'poems about love and work that everyone seems to own a copy of.' },
  { title: '1984', author: 'George Orwell', note: 'quoted to death. i\'d like to actually read it.' },
  { title: 'Animal Farm', author: 'George Orwell', note: 'everyone read it in school. i didn\'t.' },
  { title: 'The Alchemist', author: 'Paulo Coelho', note: 'the one everyone hands you. i keep not opening it.' },
  { title: 'Sense and Sensibility', author: 'Jane Austen', note: 'more austen, when the mood comes back.' },
  { title: 'The Art of War', author: 'Sun Tzu', note: 'on the shelf to make me feel strategic.' },
  { title: 'Old Roads, New Roads', author: 'Ruskin Bond', note: 'bond in the hills. for a quiet week.' },
];

export const unreadMore = 'and a longer list i keep meaning to finish.';
