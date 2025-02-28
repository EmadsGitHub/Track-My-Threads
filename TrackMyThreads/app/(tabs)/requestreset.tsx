
import React, { useRef, useState } from 'react';
import { 
    MaterialIcons,  // Material Design icons
    FontAwesome,    // Font Awesome icons
    Ionicons       // Ionicons
} from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Link } from 'expo-router';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    Image, 
    TouchableOpacity,  // For custom buttons
    ActivityIndicator,   // For loading state

  } from 'react-native';
  

  const VerificationCode = () => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<Array<TextInput | null>>([]);
  
    const handleChange = (text: string, index: number) => {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);

      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    };
    const handleKeyPress = (event: any, index: number) => {
      // Move to previous input on backspace if current input is empty
      if (event.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    };
  
    return (
      <View style={styles.codecontainer}>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <TextInput
            key={index}
            ref={ref => inputRefs.current[index] = ref}
            style={styles.input}
            maxLength={1}
            keyboardType="numeric"
            value={code[index]}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
          />
        ))}
      </View>
    );
  };
  const RequestReset = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/TrackMyThreads.png')}
        style={styles.logo}
      />
      <View style={styles.contentContainer}>
        <View style={styles.signupTitleContainer}>
          <Text style={styles.signupTitle}>
            Reset Password
          </Text>
        </View>
        <View style={styles.signupFormContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.signupInput}
              placeholder="Enter Email"
              placeholderTextColor="#000000"
            />
          </View>
          <TouchableOpacity style={styles.signupButton}>
            <Text style={styles.signupButtonText}>Send Verification Code</Text>
          </TouchableOpacity>
          <VerificationCode />
          <TouchableOpacity style={styles.GoogleButton}>
            <AntDesign name="google" size={24} color="#3674B5" />
            <Text style={styles.GoogleButtonText}>Reset Password</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    logo: {
        width: 550,
        height: 550,
        position: 'absolute',
        top: -150,
        zIndex: 1,
        opacity: 0.9,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#3674B5',
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        paddingTop: 200,
        paddingHorizontal: 25,
    },
    signupTitle: {
        fontSize: 36,
        fontWeight: '600',
        color: '#FFFDD0',
        fontFamily: 'Sora',
        letterSpacing: 1,
    },
    signupTitleContainer: {
        marginTop: 10,
        marginBottom: 20,
    },
    signupFormContainer: {
        marginTop: 30,
        width: '100%',
        gap: 25,
        alignItems: 'center',
    },
    inputContainer: {
        backgroundColor: 'rgba(217, 217, 217, 0.9)',
        borderRadius: 12,
        width: '85%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    signupInput: {
        height: 55,
        fontSize: 16,
        paddingHorizontal: 20,
        fontFamily: 'Sora',
        width: '100%',
    },
    signupButton: {
        backgroundColor: '#FFFDD0',
        padding: 15,
        borderRadius: 30,
        width: '85%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        marginTop: 10,
    },
    signupButtonText: {
        fontSize: 18,
        fontFamily: 'Sora',
        color: '#3674B5',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    loginlink: {
        fontSize: 16,
        fontFamily: 'Sora',
        color: '#FFFDD0',
        marginTop: 20,
        opacity: 0.9,
    },
    GoogleButton: {
        backgroundColor: 'rgba(217, 217, 217, 0.9)',
        padding: 15,
        borderRadius: 30,
        width: '85%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    GoogleButtonText: {
        fontSize: 16,
        fontFamily: 'Sora',
        color: '#3674B5',
        fontWeight: '600',
        marginLeft: 10,
    },
    codecontainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },  
    input: {
        width: 50,
        height: 50,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D1F8EF',
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'Sora',
        textAlign: 'center',
    },

});

export default RequestReset;
