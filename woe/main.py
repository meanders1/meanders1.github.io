from pyscript import document

SYMBOLS = ["H", "He", 
            "Li", "Be", "B", "C", "N", "O", "F", "Ne", 
            "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", 
            "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr", 
            "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe", 
            "Cs", "Ba", "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn", 
            "Fr", "Ra", "Ac", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"]

NAMES = ["Hydrogen", "Helium", 
                 "Lithium", "Beryllium", "Boron", "Carbon", "Nitrogen", "Oxygen", "Fluorine", "Neon", 
                 "Sodium", "Magnesium", "Aluminum", "Silicon", "Phosphorus", "Sulfur", "Chlorine", "Argon", 
                 "Potassium", "Calcium", "Scandium", "Titanium", "Vanadium", "Chromium", "Manganese", "Iron", "Cobalt", "Nickel", "Copper", "Zinc", "Gallium", "Germanium", "Arsenic", "Selenium", "Bromine", "Krypton", 
                 "Rubidium", "Strontium", "Yttrium", "Zirconium", "Niobium", "Molybdenum", "Technetium", "Ruthenium", "Rhodium", "Palladium", "Silver", "Cadmium", "Indium", "Tin", "Antimony", "Tellurium", "Iodine", "Xenon", 
                 "Cesium", "Barium", "Lanthanum", "Cerium", "Praseodymium", "Neodymium", "Promethium", "Samarium", "Europium", "Gadolinium", "Terbium", "Dysprosium", "Holmium", "Erbium", "Thulium", "Ytterbium", "Lutetium", "Hafnium", "Tantalum", "Tungsten", "Rhenium", "Osmium", "Iridium", "Platinum", "Gold", "Mercury", "Thallium", "Lead", "Bismuth", "Polonium", "Astatine", "Radon", 
                 "Francium", "Radium", "Actinium", "Thorium", "Protactinium", "Uranium", "Neptunium", "Plutonium", "Americium", "Curium", "Berkelium", "Californium", "Einsteinium", "Fermium", "Mendelevium", "Nobelium", "Lawrencium", "Rutherfordium", "Dubnium", "Seaborgium", "Bohrium", "Hassium", "Meitnerium", "Darmstadtium", "Roentgenium", "Copernicium", "Nihonium", "Flerovium", "Moscovium", "Livermorium", "Tennessine", "Oganesson"]

# A list of elements whose symbols create a string when concatenated
class ElementList:
    def __init__(self):
        self.elements = []
    
    # Append an element to the list of elements 
    def append(self, element):
        self.elements.append(element)

    # Creates the string represented by the elements' symbols 
    def as_text(self):
        string = ""
        for element in self.elements:
            string += SYMBOLS[element]
        return string
    
    # Returns a list of all the names of the elements 
    def names(self):
        names = []
        for element in self.elements:
            names.append(NAMES[element])
        return names
    
    def __getitem__(self, index):
        return (
            SYMBOLS[self.elements[index]],
            NAMES[self.elements[index]]
            )

    def __iter__(self):
        self.iter_counter = -1
        return self
    
    def __next__(self):
        self.iter_counter += 1
        if self.iter_counter < len(self.elements):
            return (
                SYMBOLS[self.elements[self.iter_counter]], 
                NAMES[self.elements[self.iter_counter]]
                )
        raise StopIteration
    
class PriorityList:
    def __init__(self, length):
        # 0 indicates that double letters should be tried first
        # 1 indicates that a single letter should be tried first
        self.priorities = []
        for _ in range(length):
            self.priorities.append(0)
    
    # If this PriorityList could be incremented, it is and True is returned. Else, it returns False and does not update the list  
    def increment(self):
        is_max = True
        for i in range(len(self.priorities)-1, -1, -1):
            if self.priorities[i] == 0:
                self.priorities[i] = 1
                is_max = False
                
                # set the last priorities to 0
                for j in range(i+1, len(self.priorities)):
                    self.priorities[j] = 0
                
                break
        return not is_max
    
    def __getitem__(self, index):
        return self.priorities[index]

# Find an element whose symbol is the same as the letter. If none exist, return None.
def find_single_symbol(symbols, letter):
    for i in range(len(symbols)):
        symbol = symbols[i]
        if symbol[0] == letter and len(symbol) == 1:
            return i
    return None

# Find an element whose symbol is (letter1 + letter2). If none exist, return None.
def find_double_symbol(symbols, letter1, letter2):
    for i in range(len(symbols)):
        symbol = symbols[i]
        if len(symbol) < 2:
            continue
        if symbol[0] == letter1 and symbol[1] == letter2:
            return i
    return None

# Find the elements needed to create the word
# Returns an ElementList if the word can be created from elements 
# If the word cannot be constructed from elements, None is returned
def create_word_from_elements(word_to_reproduce):
    word_to_reproduce = word_to_reproduce.strip()
    word_to_reproduce = word_to_reproduce.lower()
    lower_symbols = []
    for element in SYMBOLS:
        lower_symbols.append(element.lower())

    # Finds an element whose symbol is equal to the letter in word_to_reproduce[i], appends it to the list of found elements and returns True.
    # If no such element exist, the function appends nothing and returns False
    def find_single(i):
        letter = word_to_reproduce[i]
        
        symbol = find_single_symbol(lower_symbols, letter)
        if symbol != None:
            correct_elements.append(symbol)
            return True
        return False
    
    # Finds an element whose symbol is equal to the letter in (word_to_reproduce[i] + word_to_reproduce[i+1]), appends it to the list of found elements and returns True.
    # If no such element exist, the function appends nothing, and returns False.
    def find_double(i):
        if i >= len(word_to_reproduce)-1: # only one letter left in the string
            return False
        
        letter, next_letter = word_to_reproduce[i], word_to_reproduce[i+1]
        
        symbol = find_double_symbol(lower_symbols, letter, next_letter)
        if symbol != None:
            correct_elements.append(symbol)
            return True
        return False
    
    priorities = PriorityList(len(word_to_reproduce))
    
    while True:
        correct_elements = ElementList()
        i = 0
        while i < len(word_to_reproduce):
            priority = priorities[i]

            if priority == 0:
                # Try double, if no double is possible, try single
                if not find_double(i):
                    if find_single(i):
                        i += 1
                        continue
                else:
                    i += 2
                    continue
            elif priority == 1:
                # Try single, if no single is possible, try double
                if not find_single(i):
                    if find_double(i):
                        i += 2
                        continue
                else:
                    i += 1
                    continue
            
            break

        if len(correct_elements.as_text()) == len(word_to_reproduce):
            # The whole string has been created! Return it immediately!
            return correct_elements

        if priorities.increment() == False:
            # all combinations of prioities have been tried, and no solution has been found
            return None


# Creates a sentence from elements. Words that cannot be contructed from elements are replaced with None  
def create_sentence_from_elements(string_to_reproduce):
    words_to_reproduce = string_to_reproduce.lower().split()
    words = []
    for word in words_to_reproduce:
        created_word = create_word_from_elements(word)
        words.append(created_word)
    return words


def find(event):
    out_text = document.querySelector("#output")
    input = document.querySelector("#stringInput").value
    words_list = create_sentence_from_elements(input)
    string = ""
    for word in words_list:
        if word:
            for el in word:
                string += f"<abbr title=\"{el[0]}: {el[1]}\">" + el[0] + "</abbr>"
        else:
            string += "_"
        string += " "
    string = string[:-1]
    
    if input == "":
        out_text.innerHTML = "The constructed sentence will appear here"
    else:
        out_text.innerHTML = string